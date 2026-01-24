/**
 * QuranPagesFeature - Quran page navigation and display
 *
 * Translated from quran-ios/Features/QuranPagesFeature
 *
 * This module provides:
 * - QuranPaginationView for displaying Quran pages with pagination
 * - PageGeometryActions for hit testing
 * - PagingStrategy for single/double page modes
 * - Page localization utilities
 * - QuranSeparators for page borders
 */

// Paging Strategy
export { type PagingStrategy } from './paging-strategy';

// Page Geometry Actions
export {
  type PageGeometryActions,
  createPageGeometryActions,
  pageGeometryActionsEqual,
  GeometryActionsContext,
  type GeometryActionsContextValue,
  useGeometryActionsContext,
} from './page-geometry-actions';

// Page Localization
export {
  type MultipartText,
  type MultipartTextPart,
  createMultipartText,
  appendToMultipartText,
  appendMultipartText,
  multipartTextToString,
  multipartSuraName,
  pageSuraNames,
  pageSuraNamesString,
} from './page-localization';

// Quran Separators
export {
  PageSideSeparator,
  PageMiddleSeparator,
  QURAN_SEPARATORS_MIDDLE_WIDTH,
  QURAN_SEPARATORS_SIDE_WIDTH,
  type PageSideSeparatorProps,
} from './QuranSeparators';

// Quran Pagination View
export {
  QuranPaginationView,
  type QuranPaginationViewProps,
} from './QuranPaginationView';

