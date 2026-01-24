# Quran Expo Error Analysis Report

**Total Errors: 420**
**Analysis Date: January 2026**

This document provides a comprehensive analysis of all TypeScript errors in the quran-expo project, grouped by category with root cause explanations.

---

## Executive Summary

The errors originate from the 1:1 conversion of the native iOS (Swift) Quran app to Expo/React Native. The primary causes are:

1. **Swift class-based architecture** converted to TypeScript interfaces/classes with incompatible type relationships
2. **iOS-native APIs** (UIKit, Foundation) with no direct Expo equivalents
3. **Swift language features** (property wrappers, enums with associated values, protocols) that don't map directly to TypeScript
4. **Missing Expo modules** that need to be installed or don't exist

---

## Category 1: Interface vs Class Type Mismatch

**Error Count: ~100 errors**
**Error Type: TypeScript (TS2345, TS2740, TS2322)**

### Description
The codebase defines both interfaces (e.g., `IAyahNumber`, `IPage`, `ISura`) and classes (e.g., `AyahNumber`, `Page`, `Sura`). Many functions expect the class type but receive the interface type.

### Sample Errors
```
src/features/advanced-audio-options-feature/AdvancedAudioOptionsScreen.tsx(130,13): error TS2740: Type 'IAyahNumber' is missing the following properties from type 'AyahNumber': _sura, _ayah, description, id, and 9 more.

src/features/bookmarks-feature/bookmarks-view-model.ts(166,25): error TS2345: Argument of type 'IPage' is not assignable to parameter of type 'Page'.

src/features/home-feature/home-view-model.ts(271,21): error TS2322: Type 'ISura[]' is not assignable to type 'Sura[]'.

src/features/audio-downloads-feature/audio-downloads-view-model.ts(107,5): error TS2740: Type 'IQuran' is missing the following properties from type 'Quran': _raw, _id, _suras, _pages, and 10 more.
```

### Affected Files
- `src/features/advanced-audio-options-feature/AdvancedAudioOptionsScreen.tsx`
- `src/features/bookmarks-feature/bookmarks-view-model.ts`
- `src/features/home-feature/home-view-model.ts`
- `src/features/home-feature/HomeScreen.tsx`
- `src/features/audio-downloads-feature/audio-downloads-view-model.ts`
- `src/features/quran-content-feature/content-view-model.ts`
- `src/features/quran-content-feature/ContentScreen.tsx`
- `src/features/quran-image-feature/content-image-view-model.ts`
- `src/features/quran-translation-feature/content-translation-view-model.ts`
- `src/features/quran-translation-feature/ContentTranslationView.tsx`
- `src/features/quran-translation-feature/translation-item.ts`
- `src/features/notes-feature/notes-view-model.ts`
- `src/features/notes-feature/notes-builder.ts`
- `src/features/quran-pages-feature/page-localization.ts`
- `src/domain/quran-audio-kit/audio-player/gapless-audio-request-builder.ts`
- `src/domain/reciter-service/audio-file-list-retriever.ts`

### Root Cause
In Swift, protocols (like interfaces) and classes work seamlessly together. When the iOS app was converted, interfaces were created for forward declarations to handle circular dependencies. However, many functions were typed to expect the concrete class implementation rather than the interface.

The classes have private members (`_sura`, `_ayah`, `_quran`, etc.) and methods (`description`, `id`, `equals`, `compareTo`) that don't exist on the interfaces.

### Origin
- **iOS-native code not supported by Expo**: No
- **Incorrect assumptions from 1:1 conversion**: Yes - The conversion created both interfaces and classes but didn't consistently use interfaces throughout
- **Missing or incorrect dependencies**: No
- **Platform-specific logic**: No

---

## Category 2: Missing Module Declarations

**Error Count: 4 errors**
**Error Type: TypeScript (TS2307)**

### Sample Errors
```
src/domain/settings-service/review-service.ts(10,30): error TS2307: Cannot find module 'expo-store-review' or its corresponding type declarations.

src/features/ayah-menu-feature/ayah-menu-view-model.ts(12,28): error TS2307: Cannot find module 'expo-clipboard' or its corresponding type declarations.

src/features/quran-pages-feature/QuranSeparators.tsx(11,32): error TS2307: Cannot find module 'expo-linear-gradient' or its corresponding type declarations.

src/domain/reciter-service/reciter-data-retriever.ts(88,43): error TS2307: Cannot find module '../../assets/reciters.json' or its corresponding type declarations.
```

### Affected Files
- `src/domain/settings-service/review-service.ts`
- `src/features/ayah-menu-feature/ayah-menu-view-model.ts`
- `src/features/quran-pages-feature/QuranSeparators.tsx`
- `src/domain/reciter-service/reciter-data-retriever.ts`

### Root Cause
These modules either:
1. Need to be installed (`expo-clipboard`, `expo-linear-gradient`)
2. Don't exist in Expo with that name (`expo-store-review` - correct name is `expo-store-review` but may need installation)
3. Are missing asset files (`reciters.json` needs to be created)

### Origin
- **iOS-native code not supported by Expo**: Partially - some modules have different names
- **Missing or incorrect dependencies**: Yes - these packages need to be added to package.json

---

## Category 3: Expo Router Route Type Issues

**Error Count: 4 errors**
**Error Type: TypeScript (TS2322, TS2345)**

### Sample Errors
```
app/(tabs)/index.tsx(26,7): error TS2322: Type '"/quran"' is not assignable to type '"/" | RelativePathString | ExternalPathString | "/AppContainer" | "/create-app-dependencies" | "/_sitemap"'.

app/(tabs)/settings.tsx(27,34): error TS2345: Argument of type '"/translations"' is not assignable to parameter of type '"/" | RelativePathString | ExternalPathString | "/AppContainer"...

app/(tabs)/settings.tsx(32,34): error TS2345: Argument of type '"/reciter-list"' is not assignable to parameter of type...

app/(tabs)/settings.tsx(37,34): error TS2345: Argument of type '"/audio-downloads"' is not assignable to parameter of type...
```

### Affected Files
- `app/(tabs)/index.tsx`
- `app/(tabs)/settings.tsx`

### Root Cause
Expo Router generates TypeScript types based on the file structure in the `app/` directory. The routes `/quran`, `/translations`, `/reciter-list`, and `/audio-downloads` are being referenced but the corresponding route files don't exist in the `app/` directory.

The iOS app used UIKit's navigation system which was converted to expo-router links, but the route files weren't created.

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - The navigation structure wasn't fully converted
- **Platform-specific logic**: Yes - iOS navigation patterns don't directly map to file-based routing

---

## Category 4: Missing Properties on Types

**Error Count: ~40 errors**
**Error Type: TypeScript (TS2339)**

### Sample Errors
```
app/quran.tsx(33,26): error TS2339: Property 'startPage' does not exist on type 'ISura'.

src/features/home-feature/HomeScreen.tsx(124,22): error TS2339: Property 'localizedName' does not exist on type 'Juz'.

src/features/quran-image-feature/ContentImageView.tsx(116,37): error TS2339: Property 'localizedName' does not exist on type 'IQuarter'.

src/features/more-menu-feature/views/MoreMenuFontSizeStepper.tsx(84,78): error TS2339: Property 'systemGray5' does not exist on type '{ readonly tint: string; readonly label: "#000000"... }'.

src/features/reading-selector-feature/ReadingSelectorScreen.tsx(315,30): error TS2339: Property 'cornerRadius' does not exist on type 'Dimensions'.

src/features/quran-image-feature/content-image-view-model.ts(123,56): error TS2339: Property 'wordFramesForVerse' does not exist on type 'WordFrameCollection'.

src/features/quran-translation-feature/ContentTranslationView.tsx(267,31): error TS2339: Property 'translationName' does not exist on type 'Translation'.
```

### Affected Files
- `app/quran.tsx`
- `src/features/home-feature/HomeScreen.tsx`
- `src/features/quran-image-feature/ContentImageView.tsx`
- `src/features/quran-image-feature/content-image-view-model.ts`
- `src/features/more-menu-feature/views/MoreMenuFontSizeStepper.tsx`
- `src/features/more-menu-feature/views/MoreMenuModeSelector.tsx`
- `src/features/more-menu-feature/views/MoreMenuToggle.tsx`
- `src/features/reading-selector-feature/ReadingSelectorScreen.tsx`
- `src/features/quran-pages-feature/QuranSeparators.tsx`
- `src/features/quran-translation-feature/ContentTranslationView.tsx`
- `src/features/reading-selector-feature/reading-info.ts`
- `src/features/quran-view-feature/QuranScreen.tsx`

### Root Cause
Properties were referenced that either:
1. Exist as methods on Swift classes but weren't converted (e.g., `localizedName` is a method on `Sura` but was accessed as a property on `Juz`/`Quarter`)
2. Were iOS-specific UI properties (e.g., `systemGray5`, `cornerRadius`, `destructive`)
3. Weren't defined on the TypeScript interfaces/types

### Origin
- **iOS-native code not supported by Expo**: Partially - iOS system colors don't exist in Expo
- **Incorrect assumptions from 1:1 conversion**: Yes - Property vs method inconsistencies

---

## Category 5: PreferenceTransformer Property Name Mismatch

**Error Count: ~8 errors**
**Error Type: TypeScript (TS2739)**

### Sample Errors
```
src/domain/quran-text-kit/preferences/font-size-preferences.ts(48,7): error TS2739: Type '{ transformGet: (raw: number) => FontSize; transformSet: (value: FontSize) => number; }' is missing the following properties from type 'PreferenceTransformer<number, FontSize>': rawToValue, valueToRaw

src/domain/quran-text-kit/preferences/quran-content-state-preferences.ts(51,7): error TS2739: Type '{ transformGet: (raw: boolean) => QuranMode; transformSet: (value: QuranMode) => boolean; }' is missing the following properties from type 'PreferenceTransformer<boolean, QuranMode>': rawToValue, valueToRaw

src/domain/reading-service/reading-preferences.ts(40,7): error TS2739: Type '{ transformGet: ...; transformSet: ... }' is missing the following properties from type 'PreferenceTransformer<number, Reading>': rawToValue, valueToRaw
```

### Affected Files
- `src/domain/quran-text-kit/preferences/font-size-preferences.ts`
- `src/domain/quran-text-kit/preferences/quran-content-state-preferences.ts`
- `src/domain/reading-service/reading-preferences.ts`
- `src/domain/reciter-service/reciter-preferences.ts`
- `src/domain/word-text-service/word-text-preferences.ts`

### Root Cause
The `PreferenceTransformer` interface defines `rawToValue` and `valueToRaw` as required properties. However, some code uses the alternative names `transformGet` and `transformSet` (which are optional aliases in the interface). The code creating transformers only provides the alias names, not the required property names.

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - Naming inconsistency during conversion

---

## Category 6: Tuple Length Mismatch (usePreference Hook)

**Error Count: ~10 errors**
**Error Type: TypeScript (TS2322)**

### Sample Errors
```
src/domain/quran-text-kit/preferences/font-size-preferences.ts(68,3): error TS2322: Type '[FontSize, (value: FontSize) => Promise<void>, boolean]' is not assignable to type '[FontSize, (value: FontSize) => void]'.
  Source has 3 element(s) but target allows only 2.

src/domain/reading-service/reading-preferences.ts(61,3): error TS2322: Type '[Reading, (value: Reading) => Promise<void>, boolean]' is not assignable to type '[Reading, (value: Reading) => void]'.
  Source has 3 element(s) but target allows only 2.

src/domain/reciter-service/reciter-preferences.ts(67,3): error TS2322: Type '[number, (value: number) => Promise<void>, boolean]' is not assignable to type '[number, (value: number) => void]'.
```

### Affected Files
- `src/domain/quran-text-kit/preferences/font-size-preferences.ts`
- `src/domain/quran-text-kit/preferences/quran-content-state-preferences.ts`
- `src/domain/reading-service/reading-preferences.ts`
- `src/domain/reciter-service/reciter-preferences.ts`
- `src/domain/translation-service/selected-translations-preferences.ts`
- `src/domain/word-text-service/word-text-preferences.ts`

### Root Cause
The `usePreference` and `useTransformedPreference` hooks return 3 elements: `[value, setValue, isLoading]`. However, the return type annotations on wrapper functions expect only 2 elements `[value, setValue]`. Additionally, the setter type signature differs (`Promise<void>` vs `void`).

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - Swift's property wrappers work differently than React hooks

---

## Category 7: Date Callable Errors

**Error Count: 5 errors**
**Error Type: TypeScript (TS2349)**

### Sample Errors
```
src/data/note-persistence/note-persistence.ts(230,29): error TS2349: This expression is not callable.
  Type 'Date' has no call signatures.

src/domain/audio-updater/audio-updater.ts(77,31): error TS2349: This expression is not callable.
  Type 'Date' has no call signatures.

src/domain/audio-updater/audio-updater.ts(100,46): error TS2349: This expression is not callable.
  Type 'Date' has no call signatures.
```

### Affected Files
- `src/data/note-persistence/note-persistence.ts`
- `src/domain/audio-updater/audio-updater.ts`

### Root Cause
In Swift, `Date()` is a constructor call that creates a new Date instance. The converted code tries to call a `Date` object as a function (e.g., `someDate()`) instead of creating a new Date with `new Date()` or accessing Date properties.

### Origin
- **iOS-native code not supported by Expo**: Yes - Swift Date API differs from JavaScript Date

---

## Category 8: Type vs Value Usage

**Error Count: ~12 errors**
**Error Type: TypeScript (TS2693, TS1361)**

### Sample Errors
```
src/domain/quran-text-kit/search/composite-searcher.ts(42,78): error TS2693: 'SearchResultSource' only refers to a type, but is being used as a value here.

src/domain/quran-text-kit/search/searchers.ts(195,61): error TS2693: 'Language' only refers to a type, but is being used as a value here.

src/features/advanced-audio-options-feature/runs-localization.ts(31,10): error TS1361: 'Runs' cannot be used as a value because it was imported using 'import type'.

src/features/app-migration-feature/reciters-path-migrator.ts(82,28): error TS2693: 'Reciter' only refers to a type, but is being used as a value here.
```

### Affected Files
- `src/domain/quran-text-kit/search/composite-searcher.ts`
- `src/domain/quran-text-kit/search/searchers.ts`
- `src/features/advanced-audio-options-feature/runs-localization.ts`
- `src/features/app-migration-feature/reciters-path-migrator.ts`

### Root Cause
In Swift, enums and types can be used both as types and as values with static members. The converted code tries to use TypeScript types as runtime values (e.g., comparing against an enum member when the enum was imported as a type, or trying to access static properties on a type alias).

### Origin
- **iOS-native code not supported by Expo**: Yes - Swift enum pattern differs from TypeScript

---

## Category 9: ReadOnly vs Mutable Collections

**Error Count: ~10 errors**
**Error Type: TypeScript (TS2345, TS4104)**

### Sample Errors
```
src/domain/quran-text-kit/search/composite-searcher.ts(154,24): error TS2339: Property 'push' does not exist on type 'readonly SearchResult[]'.

src/domain/reading-service/reading-resource-downloader.ts(63,44): error TS2345: Argument of type 'readonly DownloadRequest[]' is not assignable to parameter of type '{ destination: string; }[]'.
  The type 'readonly DownloadRequest[]' is 'readonly' and cannot be assigned to the mutable type...

src/features/quran-translation-feature/ContentTranslationView.tsx(237,13): error TS4104: The type 'readonly StringRange[]' is 'readonly' and cannot be assigned to the mutable type 'TextRange[]'.

src/features/note-editor-feature/note-editor-interactor.ts(183,9): error TS2345: Argument of type 'ReadonlySet<IAyahNumber>' is not assignable to parameter of type 'Set<IAyahNumber>'.
```

### Affected Files
- `src/domain/quran-text-kit/search/composite-searcher.ts`
- `src/domain/reading-service/reading-resource-downloader.ts`
- `src/features/quran-translation-feature/ContentTranslationView.tsx`
- `src/features/note-editor-feature/note-editor-interactor.ts`

### Root Cause
Swift's `let` arrays are immutable by default, but the conversion created `readonly` arrays in TypeScript. However, other parts of the code try to mutate these arrays or pass them to functions expecting mutable arrays.

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - Immutability patterns differ between Swift and TypeScript

---

## Category 10: Missing/Incorrect Exports

**Error Count: ~15 errors**
**Error Type: TypeScript (TS2724, TS2308)**

### Sample Errors
```
src/domain/quran-text-kit/localization/quran-kit-localization.ts(11,22): error TS2724: '"../../../core/localization"' has no exported member named 'Table'. Did you mean 'lTable'?

src/features/app-migration-feature/file-system-migrator.ts(13,10): error TS2724: '"../../core/utilities/string"' has no exported member named 'appendPathComponent'. Did you mean 'pathComponents'?

src/domain/reciter-service/reciter-data-retriever.ts(11,42): error TS2724: '"../../model/quran-audio"' has no exported member named 'AudioTypeGapless'. Did you mean 'AudioTypeGapped'?

src/features/index.ts(56,1): error TS2308: Module './audio-banner-feature' has already exported a member named 'AdvancedAudioOptions'. Consider explicitly re-exporting to resolve the ambiguity.
```

### Affected Files
- `src/domain/quran-text-kit/localization/quran-kit-localization.ts`
- `src/features/app-migration-feature/file-system-migrator.ts`
- `src/domain/reciter-service/reciter-data-retriever.ts`
- `src/features/index.ts`
- `src/features/ayah-menu-feature/ayah-menu-view-model.ts`
- `src/features/ayah-menu-feature/AyahMenuScreen.tsx`
- `src/features/notes-feature/NotesScreen.tsx`
- `src/features/more-menu-feature/views/MoreMenuFontSizeStepper.tsx`
- `src/features/quran-view-feature/quran-builder.ts`

### Root Cause
1. Export names changed during conversion (e.g., `Table` → `lTable`)
2. Functions that exist in iOS weren't implemented (e.g., `appendPathComponent`)
3. Duplicate exports from re-exporting modules
4. Types were renamed or reorganized differently than the original

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - Naming and module structure inconsistencies

---

## Category 11: Duplicate Definitions

**Error Count: 4 errors**
**Error Type: TypeScript (TS2393, TS2300)**

### Sample Errors
```
src/core/utilities/relative-file-path.ts(118,3): error TS2393: Duplicate function implementation.

src/core/utilities/relative-file-path.ts(239,3): error TS2393: Duplicate function implementation.

src/features/quran-view-feature/quran-interactor.ts(15,21): error TS2300: Duplicate identifier 'PageBookmark'.

src/features/quran-view-feature/quran-interactor.ts(16,15): error TS2300: Duplicate identifier 'PageBookmark'.
```

### Affected Files
- `src/core/utilities/relative-file-path.ts`
- `src/features/quran-view-feature/quran-interactor.ts`

### Root Cause
Swift allows function overloading based on parameter types, but TypeScript doesn't support the same pattern. The conversion created duplicate function implementations with the same name. Also, importing both a type and a class with the same name creates conflicts.

### Origin
- **iOS-native code not supported by Expo**: Yes - Swift's function overloading not supported in TypeScript

---

## Category 12: Theme/Color System Missing Properties

**Error Count: ~12 errors**
**Error Type: TypeScript (TS2339)**

### Sample Errors
```
src/features/more-menu-feature/views/MoreMenuFontSizeStepper.tsx(84,78): error TS2339: Property 'systemGray5' does not exist on type '{ readonly tint: string; readonly label: "#000000"...'.

src/features/more-menu-feature/views/MoreMenuToggle.tsx(40,43): error TS2339: Property 'systemGray3' does not exist on type...

src/features/quran-pages-feature/QuranSeparators.tsx(45,38): error TS2339: Property 'pageSeparatorBackground' does not exist on type...

src/features/quran-view-feature/QuranScreen.tsx(94,64): error TS2339: Property 'destructive' does not exist on type...
```

### Affected Files
- `src/features/more-menu-feature/views/MoreMenuFontSizeStepper.tsx`
- `src/features/more-menu-feature/views/MoreMenuModeSelector.tsx`
- `src/features/more-menu-feature/views/MoreMenuToggle.tsx`
- `src/features/quran-pages-feature/QuranSeparators.tsx`
- `src/features/quran-view-feature/QuranScreen.tsx`

### Root Cause
iOS UIKit provides semantic colors like `systemGray3`, `systemGray5`, `destructive`, etc. The Expo theme system (`SystemColors`) was created but doesn't include all the iOS color variants. The code references iOS-specific color names that weren't added to the theme definition.

### Origin
- **iOS-native code not supported by Expo**: Yes - iOS UIKit colors don't exist in Expo

---

## Category 13: Null vs Undefined Handling

**Error Count: ~20 errors**
**Error Type: TypeScript (TS2322, TS18048, TS2722)**

### Sample Errors
```
src/core/oauth-service/oauth-service-impl.ts(168,7): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.

src/domain/reciter-service/audio-file-list-retriever.ts(208,5): error TS2322: Type 'ISura | undefined' is not assignable to type 'ISura | null'.
  Type 'undefined' is not assignable to type 'ISura | null'.

src/features/audio-banner-feature/audio-banner-view-model.ts(636,7): error TS2722: Cannot invoke an object which is possibly 'undefined'.

src/features/quran-image-feature/ContentImageView.tsx(72,42): error TS18048: 'state.scale.scaleY' is possibly 'undefined'.
```

### Affected Files
- `src/core/oauth-service/oauth-service-impl.ts`
- `src/domain/reciter-service/audio-file-list-retriever.ts`
- `src/features/audio-banner-feature/audio-banner-view-model.ts`
- `src/features/quran-image-feature/ContentImageView.tsx`
- `src/features/quran-content-feature/content-view-model.ts`
- `src/features/app-migration-feature/file-system-migrator.ts`
- `src/domain/quran-text-kit/preferences/quran-content-state-preferences.ts`

### Root Cause
Swift uses `nil` and optionals with specific semantics. TypeScript has both `null` and `undefined`. The conversion inconsistently used `null` vs `undefined`, and strict null checks flag these mismatches. Additionally, optional chaining wasn't consistently applied.

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - Swift's Optional differs from TypeScript's null/undefined

---

## Category 14: Function Argument Count Mismatch

**Error Count: ~25 errors**
**Error Type: TypeScript (TS2554)**

### Sample Errors
```
src/data/batch-downloader/downloads-persistence.ts(128,28): error TS2554: Expected 2 arguments, but got 1.

src/domain/annotations-service/last-page-service.ts(84,12): error TS2554: Expected 3 arguments, but got 1.

src/domain/image-service/image-data-service.ts(54,29): error TS2554: Expected 2 arguments, but got 1.

src/domain/quran-audio-kit/audio-player/gapless-audio-request-builder.ts(115,7): error TS2554: Expected 1-2 arguments, but got 4.

src/domain/reading-service/reading-resources-service.ts(76,38): error TS2554: Expected 1-2 arguments, but got 0.
```

### Affected Files
- `src/data/batch-downloader/downloads-persistence.ts`
- `src/domain/annotations-service/last-page-service.ts`
- `src/domain/annotations-service/page-bookmark-service.ts`
- `src/domain/image-service/image-data-service.ts`
- `src/domain/quran-audio-kit/audio-player/gapless-audio-request-builder.ts`
- `src/domain/quran-audio-kit/audio-player/gapped-audio-request-builder.ts`
- `src/domain/reading-service/reading-resource-downloader.ts`
- `src/domain/reading-service/reading-resources-service.ts`
- `src/domain/quran-text-kit/search/composite-searcher.ts`
- `src/domain/quran-text-kit/search/searchers.ts`
- `src/domain/translation-service/translations-downloader.ts`
- `src/features/audio-banner-feature/audio-banner-view-model.ts`
- `src/features/audio-downloads-feature/audio-downloads-view-model.ts`

### Root Cause
Function signatures were defined with a certain number of parameters, but call sites pass a different number. This often happened because:
1. Swift default parameters work differently than TypeScript
2. Swift initializers/constructors were converted but call sites weren't updated
3. Functions were refactored but not all call sites were updated

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - API inconsistencies during conversion

---

## Category 15: String Literal vs Enum Type Issues

**Error Count: ~15 errors**
**Error Type: TypeScript (TS2678, TS2367)**

### Sample Errors
```
src/domain/quran-audio-kit/audio-player/gapless-audio-request-builder.ts(129,9): error TS2367: This comparison appears to be unintentional because the types 'AudioType' and 'string' have no overlap.

src/features/more-menu-feature/MoreMenuScreen.tsx(175,10): error TS2678: Type '"translation"' is not comparable to type 'WordTextType'.

src/features/ayah-menu-feature/ayah-menu-view-model.ts(91,12): error TS2678: Type '"juz"' is not comparable to type 'AudioEnd'.

src/features/quran-image-feature/content-image-view-model.ts(307,12): error TS2678: Type '"green"' is not comparable to type 'NoteColor'.
```

### Affected Files
- `src/domain/quran-audio-kit/audio-player/gapless-audio-request-builder.ts`
- `src/domain/quran-audio-kit/audio-player/gapped-audio-request-builder.ts`
- `src/domain/quran-audio-kit/audio-player/quran-audio-player.ts`
- `src/features/more-menu-feature/MoreMenuScreen.tsx`
- `src/features/ayah-menu-feature/ayah-menu-view-model.ts`
- `src/features/quran-image-feature/content-image-view-model.ts`

### Root Cause
Swift enums with raw values were converted to TypeScript enums or union types. However, switch/case statements compare against string literals instead of enum values. TypeScript's strict type checking flags these as invalid comparisons.

### Origin
- **iOS-native code not supported by Expo**: Yes - Swift enum raw values work differently

---

## Category 16: AsyncIterable vs Array Conflicts

**Error Count: ~6 errors**
**Error Type: TypeScript (TS2339, TS2488, TS2740)**

### Sample Errors
```
src/features/quran-content-feature/content-view-model.ts(368,8): error TS2339: Property 'then' does not exist on type 'AsyncIterable<Note[]>'.

src/features/quran-translation-feature/content-translation-view-model.ts(343,35): error TS2488: Type 'TranslatedVerses' must have a '[Symbol.iterator]()' method that returns an iterator.

src/features/quran-view-feature/quran-interactor.ts(320,21): error TS2740: Type 'AsyncIterable<Note[]>' is missing the following properties from type 'Note[]': length, pop, push, concat, and 35 more.
```

### Affected Files
- `src/features/quran-content-feature/content-view-model.ts`
- `src/features/quran-translation-feature/content-translation-view-model.ts`
- `src/features/quran-view-feature/quran-interactor.ts`

### Root Cause
Swift's Combine publishers and async sequences were converted to `AsyncIterable` types, but the consuming code treats them as regular arrays or Promises. The code tries to call `.then()` on AsyncIterable or iterate with `for...of` on types that aren't iterable.

### Origin
- **iOS-native code not supported by Expo**: Yes - Swift Combine has no direct equivalent

---

## Category 17: Navigation Type Incompatibilities

**Error Count: 2 errors**
**Error Type: TypeScript (TS2345)**

### Sample Errors
```
src/features/app-structure-feature/common/TabNavigator.tsx(67,42): error TS2345: Argument of type 'Omit<NavigationProp<RootParamList>, "getState"> & { getState(): ... }' is not assignable to parameter of type 'NavigationProp<any>'.

src/features/app-structure-feature/common/TabNavigator.tsx(112,42): error TS2345: Similar navigation type error...
```

### Affected Files
- `src/features/app-structure-feature/common/TabNavigator.tsx`

### Root Cause
React Navigation's TypeScript types are complex, and the navigation prop type doesn't exactly match what's expected. This is likely due to custom navigation helpers that modify the navigation object's shape.

### Origin
- **Platform-specific logic**: Partially - iOS UIKit navigation patterns converted to React Navigation

---

## Category 18: Object Property Name Mismatches

**Error Count: ~8 errors**
**Error Type: TypeScript (TS2353, TS2561)**

### Sample Errors
```
src/features/quran-image-feature/content-image-view-model.ts(99,38): error TS2561: Object literal may only specify known properties, but 'offsetX' does not exist in type 'WordFrameScale'. Did you mean to write 'xOffset'?

src/features/audio-banner-feature/audio-banner-view-model.ts(93,44): error TS2353: Object literal may only specify known properties, and 'reciterName' does not exist in type '{ type: "readyToPlay"; reciter: string; }'.

src/domain/audio-timing-service/reciter-timing-retriever.ts(64,7): error TS2353: Object literal may only specify known properties, and 'timings' does not exist in type 'Map<number, SuraTiming>'.
```

### Affected Files
- `src/features/quran-image-feature/content-image-view-model.ts`
- `src/features/audio-banner-feature/audio-banner-view-model.ts`
- `src/domain/audio-timing-service/reciter-timing-retriever.ts`
- `src/domain/word-frame-service/word-frame-processor.ts`
- `src/domain/reading-service/reading-resource-downloader.ts`
- `src/features/bookmarks-feature/BookmarksScreen.tsx`
- `src/features/home-feature/HomeScreen.tsx`

### Root Cause
Property names were inconsistent between type definitions and usage:
- `offsetX` vs `xOffset`
- `reciterName` vs `reciter`
- Object literals created with properties not defined in the type

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - Naming conventions inconsistent

---

## Category 19: Database Connection Type Issues

**Error Count: ~10 errors**
**Error Type: TypeScript (TS2345)**

### Sample Errors
```
src/domain/audio-updater/audio-updater.ts(210,59): error TS2345: Argument of type 'string' is not assignable to parameter of type 'DatabaseConnection'.

src/domain/image-service/image-data-service.ts(46,55): error TS2345: Argument of type 'string' is not assignable to parameter of type 'DatabaseConnection'.

src/domain/translation-service/local-translations-retriever.ts(30,64): error TS2345: Argument of type 'string' is not assignable to parameter of type 'DatabaseConnection'.
```

### Affected Files
- `src/domain/audio-updater/audio-updater.ts`
- `src/domain/image-service/image-data-service.ts`
- `src/domain/translation-service/local-translations-retriever.ts`
- `src/domain/translation-service/translation-deleter.ts`
- `src/domain/translation-service/translations-repository.ts`
- `src/domain/translation-service/translations-version-updater.ts`
- `src/domain/quran-text-kit/search/composite-searcher.ts`
- `src/domain/quran-text-kit/text/shareable-verse-text-retriever.ts`

### Root Cause
Database functions expect a `DatabaseConnection` type (likely wrapping expo-sqlite), but string paths are being passed instead. The iOS app uses different database connection patterns than what was defined in the TypeScript types.

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - Database API wrapper types don't match usage

---

## Category 20: NoorSystemImage Enum Usage

**Error Count: ~5 errors**
**Error Type: TypeScript (TS2322)**

### Sample Errors
```
src/features/advanced-audio-options-feature/AdvancedAudioOptionsScreen.tsx(89,21): error TS2322: Type 'NoorSystemImage.Play' is not assignable to type '"text" | "search" | "repeat" | "link" | "at" | "remove" | "options"...'

src/features/audio-downloads-feature/AudioDownloadsScreen.tsx(259,13): error TS2322: Type 'NoorSystemImage.Download' is not assignable to type '"text" | "search"...'

src/features/bookmarks-feature/BookmarksScreen.tsx(150,11): error TS2322: Type '"bookmark"' is not assignable to type 'NoorSystemImage'.
```

### Affected Files
- `src/features/advanced-audio-options-feature/AdvancedAudioOptionsScreen.tsx`
- `src/features/audio-downloads-feature/AudioDownloadsScreen.tsx`
- `src/features/bookmarks-feature/BookmarksScreen.tsx`
- `src/features/notes-feature/NotesScreen.tsx`

### Root Cause
The `NoorSystemImage` enum was created to map SF Symbols to cross-platform icons. However, some components expect the SF Symbol string directly (for Expo Symbols), while others expect the enum value. The type system sees these as incompatible.

### Origin
- **iOS-native code not supported by Expo**: Partially - SF Symbols vs Expo vector icons

---

## Category 21: NoteService Callable Type Error

**Error Count: 3 errors**
**Error Type: TypeScript (TS2349, TS2430)**

### Sample Errors
```
src/features/ayah-menu-feature/ayah-menu-builder.ts(56,40): error TS2349: This expression is not callable.
  Type 'NoteService' has no call signatures.

src/features/quran-content-feature/content-builder.ts(56,40): error TS2349: This expression is not callable.
  Type 'NoteService' has no call signatures.

src/features/app-dependencies/app-dependencies.ts(153,18): error TS2430: Interface 'AppDependenciesWithFactories' incorrectly extends interface 'AppDependencies'.
  Types of property 'noteService' are incompatible.
    Type '() => NoteService' is not assignable to type 'NoteService'.
```

### Affected Files
- `src/features/ayah-menu-feature/ayah-menu-builder.ts`
- `src/features/quran-content-feature/content-builder.ts`
- `src/features/quran-view-feature/quran-builder.ts`
- `src/features/app-dependencies/app-dependencies.ts`

### Root Cause
The dependency injection pattern stores either a service instance or a factory function. The code tries to call `noteService()` as if it's a factory function, but the type expects it to be a service instance directly.

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - Dependency injection patterns differ

---

## Category 22: Crasher Key Type Issues

**Error Count: ~8 errors**
**Error Type: TypeScript (TS2345)**

### Sample Errors
```
src/features/audio-banner-feature/audio-banner-view-model.ts(290,49): error TS2345: Argument of type 'string' is not assignable to parameter of type 'CrasherKey<number>'.

src/features/audio-banner-feature/audio-banner-view-model.ts(552,28): error TS2345: Argument of type 'string' is not assignable to parameter of type 'CrasherKey<boolean>'.

src/features/quran-content-feature/content-view-model.ts(342,54): error TS2345: Argument of type 'string' is not assignable to parameter of type 'CrasherKey<number[]>'.
```

### Affected Files
- `src/features/audio-banner-feature/audio-banner-view-model.ts`
- `src/features/quran-content-feature/content-view-model.ts`

### Root Cause
The crasher/logging system expects typed keys (`CrasherKey<T>`) to ensure type safety when logging values. However, plain strings are being passed instead of the properly typed key objects.

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - Logging API types don't match usage

---

## Category 23: Localization Function Parameter Types

**Error Count: ~5 errors**
**Error Type: TypeScript (TS2345)**

### Sample Errors
```
src/domain/quran-text-kit/localization/quran-kit-localization.ts(22,47): error TS2345: Argument of type 'number' is not assignable to parameter of type 'Language | undefined'.

src/domain/quran-text-kit/localization/quran-kit-localization.ts(49,53): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Language | undefined'.

src/features/audio-downloads-feature/audio-download-item.ts(130,69): error TS2345: Argument of type 'number' is not assignable to parameter of type 'TranslationTable | undefined'.
```

### Affected Files
- `src/domain/quran-text-kit/localization/quran-kit-localization.ts`
- `src/features/audio-downloads-feature/audio-download-item.ts`
- `src/features/home-feature/HomeScreen.tsx`
- `src/features/notes-feature/NotesScreen.tsx`
- `src/features/quran-view-feature/QuranScreen.tsx`
- `src/features/quran-translation-feature/ContentTranslationView.tsx`

### Root Cause
Localization functions expect specific types (`Language`, `TranslationTable`) but are being called with `number` or `string` values. The iOS app likely used numeric or string identifiers that need to be converted to the proper types.

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - Type definitions don't match actual usage

---

## Category 24: Runs Type Assignment Issues

**Error Count: 6 errors**
**Error Type: TypeScript (TS2322)**

### Sample Errors
```
src/features/advanced-audio-options-feature/runs-localization.ts(20,3): error TS2322: Type '{ type: string; }' is not assignable to type 'Runs'.

src/features/audio-banner-feature/audio-banner-view-model.ts(126,11): error TS2322: Type '{ type: string; }' is not assignable to type 'Runs'.
```

### Affected Files
- `src/features/advanced-audio-options-feature/runs-localization.ts`
- `src/features/audio-banner-feature/audio-banner-view-model.ts`

### Root Cause
The `Runs` type likely expects specific literal types for the `type` property (like `'once' | 'continuous'`), but the code creates objects with generic `string` type. TypeScript's inference creates `{ type: string }` instead of `{ type: 'once' }`.

### Origin
- **Incorrect assumptions from 1:1 conversion**: Yes - Type narrowing not applied

---

## Category 25: Missing Service Methods/Properties

**Error Count: ~8 errors**
**Error Type: TypeScript (TS2339)**

### Sample Errors
```
src/features/quran-view-feature/quran-interactor.ts(278,27): error TS2339: Property 'notesPublisher' does not exist on type 'NoteService'.

src/features/quran-view-feature/quran-interactor.ts(283,35): error TS2339: Property 'pageBookmarksPublisher' does not exist on type 'PageBookmarkService'.

src/features/quran-view-feature/quran-interactor.ts(294,25): error TS2339: Property 'addStatusListener' does not exist on type 'ReadingResourcesService'.

src/features/quran-translation-feature/content-translation-view-model.ts(414,42): error TS2339: Property 'addListener' does not exist on type 'SelectedTranslationsPreferencesImpl'.
```

### Affected Files
- `src/features/quran-view-feature/quran-interactor.ts`
- `src/features/reading-selector-feature/reading-selector-view-model.ts`
- `src/features/quran-translation-feature/content-translation-view-model.ts`

### Root Cause
Service interfaces were defined without all the methods that the iOS implementation has. The iOS app uses Combine publishers (like `notesPublisher`, `pageBookmarksPublisher`) and listener patterns that weren't fully defined in the TypeScript interfaces.

### Origin
- **iOS-native code not supported by Expo**: Yes - Combine publishers need to be converted to event emitters or observables

---

## Summary Statistics

| Category | Count | Primary Cause |
|----------|-------|---------------|
| Interface vs Class Type Mismatch | ~100 | 1:1 Conversion |
| Missing Module Declarations | 4 | Missing Dependencies |
| Expo Router Route Issues | 4 | Missing Route Files |
| Missing Properties on Types | ~40 | Conversion + iOS APIs |
| PreferenceTransformer Naming | ~8 | 1:1 Conversion |
| Tuple Length Mismatch | ~10 | Swift vs React patterns |
| Date Callable Errors | 5 | iOS APIs |
| Type vs Value Usage | ~12 | Swift vs TypeScript |
| ReadOnly vs Mutable | ~10 | 1:1 Conversion |
| Missing/Incorrect Exports | ~15 | 1:1 Conversion |
| Duplicate Definitions | 4 | Swift Overloading |
| Theme/Color Missing Properties | ~12 | iOS UIKit Colors |
| Null vs Undefined | ~20 | 1:1 Conversion |
| Function Argument Mismatch | ~25 | 1:1 Conversion |
| String vs Enum Types | ~15 | Swift Enums |
| AsyncIterable vs Array | ~6 | Combine Publishers |
| Navigation Types | 2 | iOS Navigation |
| Object Property Names | ~8 | 1:1 Conversion |
| Database Connection Types | ~10 | 1:1 Conversion |
| NoorSystemImage Usage | ~5 | iOS SF Symbols |
| NoteService Callable | 3 | DI Patterns |
| Crasher Key Types | ~8 | 1:1 Conversion |
| Localization Parameters | ~5 | 1:1 Conversion |
| Runs Type Assignment | 6 | 1:1 Conversion |
| Missing Service Methods | ~8 | iOS Combine |

**Total: ~420 errors**

---

## Error Origin Summary

| Origin | Percentage |
|--------|------------|
| Incorrect assumptions from 1:1 conversion | ~65% |
| iOS-native code not supported by Expo | ~25% |
| Missing or incorrect dependencies | ~5% |
| Platform-specific logic | ~5% |

---

## Next Steps (For Future Phase)

This report documents all errors without proposing fixes. When the fix phase begins, the recommended approach order would be:

1. Install missing npm packages
2. Create missing route files for expo-router
3. Unify Interface/Class usage pattern
4. Add missing properties to theme/color definitions
5. Fix preference transformer naming
6. Address null vs undefined inconsistencies
7. Fix function signatures and call sites
8. Convert AsyncIterable patterns to appropriate React patterns
9. Fix enum/string literal type comparisons
10. Address remaining type mismatches
