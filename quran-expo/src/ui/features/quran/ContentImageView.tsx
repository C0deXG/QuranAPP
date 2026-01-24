import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    View,
    Image,
    StyleSheet,
    LayoutChangeEvent,
    PanResponder,
    GestureResponderEvent,
    PanResponderGestureState,
} from 'react-native';
import { ContentImageViewModel, ContentImageViewState } from '@/src/features/quran-image-feature/content-image-view-model';
import {
    scaleRect,
    scalingImageIntoView,
    createSize,
    wordFrameRect,
    WordFrameScale
} from '@/src/model/quran-geometry';
import { useTheme } from '@/src/ui/theme';
import { getPageImage } from '@/assets/images/quran_pages';
import type { IAyahNumber } from '@/src/model/quran-kit';

interface ContentImageViewProps {
    viewModel: ContentImageViewModel;
    onPress?: () => void;
    onPressIn?: (pageNumber: number, verse?: IAyahNumber) => void;
    onLongPress?: (pageNumber: number, verse?: IAyahNumber) => void;
    onLongPressMove?: (pageNumber: number, verse?: IAyahNumber) => void;
    onLongPressEnd?: (pageNumber: number, verse?: IAyahNumber) => void;
    onLongPressCancel?: (pageNumber: number, verse?: IAyahNumber) => void;
}

export const ContentImageView: React.FC<ContentImageViewProps> = ({
    viewModel,
    onPress,
    onPressIn,
    onLongPress,
    onLongPressMove,
    onLongPressEnd,
    onLongPressCancel,
}) => {
    const theme = useTheme();
    const [state, setState] = useState<ContentImageViewState>(viewModel.state);
    const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
    const [debugInfo, setDebugInfo] = useState<string>("");
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const longPressActiveRef = useRef(false);

    // Subscribe to VM updates
    useEffect(() => {
        const listener = (newState: ContentImageViewState) => {
            setState(newState);
            // Refresh debug info when state changes (e.g. data loaded)
            viewModel.getDebugDatabaseInfo().then(setDebugInfo);
        };
        viewModel.addListener(listener);

        // Trigger initial load
        viewModel.loadImagePage();

        return () => viewModel.removeListener(listener);
    }, [viewModel]);

    // Handle layout to calculate scale
    const onLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        console.log(`[DEBUG] ContentImageView onLayout: ${width}x${height}`);
        setViewSize({ width, height });
        viewModel.setImageFrame({ x: 0, y: 0, width, height });
    };

    const { imagePage } = state;
    const decorations = viewModel.decorations;

    // Get image source from bundled assets
    const imageSource = getPageImage(viewModel.page.pageNumber);

    // Calculate scale
    const scale: WordFrameScale | null = useMemo(() => {
        if (!imagePage?.image || viewSize.width === 0 || viewSize.height === 0) {
            return null;
        }
        const imageSize = createSize(imagePage.image.width, imagePage.image.height);
        const vSize = createSize(viewSize.width, viewSize.height);
        const newScale = scalingImageIntoView(imageSize, vSize);

        // Update VM with scale for hit testing
        viewModel.setScale(newScale);

        return newScale;
    }, [imagePage, viewSize, viewModel]);

    const isDarkMode = theme.isDark;
    const imageKey = `page-image-${viewModel.page.pageNumber}-${isDarkMode ? 'dark' : 'light'}`;

    const clearLongPressTimer = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const verseAtPoint = (point: { x: number; y: number } | null) => {
        if (!point) return undefined;
        const word = viewModel.wordAtGlobalPoint({
            x: point.x,
            y: point.y,
        });
        return word?.verse;
    };

    const LONG_PRESS_DELAY_MS = 400;
    const MOVE_CANCEL_THRESHOLD = 12; // points, similar to iOS long-press maxDistance

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
            longPressActiveRef.current = false;
            clearLongPressTimer();

            // Snapshot the touch point to avoid pooled event access later.
            const point = {
                x: event.nativeEvent.locationX,
                y: event.nativeEvent.locationY,
            };
            const verse = verseAtPoint(point);
            onPressIn?.(viewModel.page.pageNumber, verse);

            longPressTimerRef.current = setTimeout(() => {
                longPressActiveRef.current = true;
                const targetVerse = verseAtPoint(point) ?? verse;
                onLongPress?.(viewModel.page.pageNumber, targetVerse);
            }, LONG_PRESS_DELAY_MS);
        },
        onPanResponderMove: (event, gestureState: PanResponderGestureState) => {
            if (!longPressActiveRef.current) {
                // Cancel pending long-press if moved too far before activation
                const dx = gestureState.dx;
                const dy = gestureState.dy;
                if (Math.sqrt(dx * dx + dy * dy) > MOVE_CANCEL_THRESHOLD) {
                    clearLongPressTimer();
                }
                return;
            }
            const verse = verseAtPoint({
                x: event.nativeEvent.locationX,
                y: event.nativeEvent.locationY,
            });
            onLongPressMove?.(viewModel.page.pageNumber, verse);
        },
        onPanResponderRelease: (event) => {
            const verse = verseAtPoint({
                x: event.nativeEvent.locationX,
                y: event.nativeEvent.locationY,
            });
            const wasActive = longPressActiveRef.current;
            clearLongPressTimer();
            longPressActiveRef.current = false;

            if (wasActive) {
                onLongPressEnd?.(viewModel.page.pageNumber, verse);
            } else {
                onPress?.();
            }
        },
        onPanResponderTerminate: (event) => {
            const wasActive = longPressActiveRef.current;
            clearLongPressTimer();
            longPressActiveRef.current = false;

            if (wasActive) {
                const verse = verseAtPoint({
                    x: event.nativeEvent.locationX,
                    y: event.nativeEvent.locationY,
                });
                onLongPressCancel?.(viewModel.page.pageNumber, verse);
            }
        },
        onPanResponderTerminationRequest: () => true,
    }), [onLongPress, onLongPressCancel, onLongPressEnd, onLongPressMove, onPress, onPressIn, viewModel]);

    return (
        <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
            {imageSource && (
                <Image
                    key={imageKey} // force remount on theme changes to clear cached tint
                    source={imageSource}
                    style={[
                        styles.image,
                        // No tint in light mode; rely on raw PNG colors for both modes
                        isDarkMode ? { tintColor: theme.themeColors.textColor } : { tintColor: undefined },
                    ]}
                    resizeMode="contain"
                />
            )}

            {/* Highlights Overlay */}
            {scale && Array.from(decorations.highlights.entries()).map(([frame, color], index) => {
                const rawRect = wordFrameRect(frame);
                const scaled = scaleRect(rawRect, scale);
                // Expand slightly to avoid visible seams between adjacent rects (multi-line ayahs)
                const padY = 0.75;
                const padX = 0.25;
                const adjusted = {
                    x: scaled.x - padX,
                    y: scaled.y - padY,
                    width: scaled.width + padX * 2,
                    height: scaled.height + padY * 2,
                };

                return (
                    <View
                        key={`highlight-${index}`}
                        style={{
                            position: 'absolute',
                            left: adjusted.x,
                            top: adjusted.y,
                            width: adjusted.width,
                            height: adjusted.height,
                            backgroundColor: color,
                            borderRadius: 0,
                        }}
                        pointerEvents="none"
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
});
