/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Utility functions for transforming BigQuery API responses
 * @param rows - Raw rows from BigQuery API response
 * @param columns - Column definitions used to map BigQuery fields to table columns
 * @returns Transformed rows suitable for rendering in the data table
 */
export const transformBigQueryRows = (rows: any[], columns: any[]): any[] => {
  if (!rows || !Array.isArray(rows)) return [];

  return rows.map((rowInfo: any) => {
    const transformRowInfo: any = {};

    if (!rowInfo['f'] || !Array.isArray(rowInfo['f'])) return transformRowInfo;

    rowInfo['f'].forEach((fieldInfo: any, index: number) => {
      const col = columns[index];
      const columnKey = col?.Header || col?.field || col?.accessor;

      if (columnKey) {
        const rawValue = fieldInfo['v'];
        // Safely stringify objects, otherwise return the raw value
        transformRowInfo[columnKey] =
          typeof rawValue === 'object' && rawValue !== null
            ? JSON.stringify(rawValue)
            : rawValue;
      }
    });
    return transformRowInfo;
  });
};

/**
 * Builds the API URL for fetching BigQuery preview data with support for pagination, filtering, sorting, grouping, and aggregation.
 * @param projectId - The ID of the BigQuery project
 * @param dataSetId - The ID of the BigQuery dataset
 * @param tableId - The ID of the BigQuery table
 * @param maxResults - The maximum number of results to fetch per page
 * @param pageIndex - The current page index for pagination
 * @param filterModel - The filter model containing filter conditions
 * @param sortModel - The sort model containing sorting conditions
 * @param groupByColumns - An array of column names to group by
 * @param aggregations - An array of aggregation definitions, each containing a column and an aggregation function
 * @returns A string representing the constructed API URL with query parameters for the specified options
 */
export const buildBigQueryApiUrl = (
  projectId: string,
  dataSetId: string,
  tableId: string,
  maxResults: number,
  pageIndex: number,
  filterModel?: any,
  sortModel?: any,
  groupByColumns?: string[],
  aggregations?: any
): string => {
  let filterQuery = '';
  if (filterModel?.items?.length > 0) {
    filterModel.items.forEach((item: any) => {
      if (
        item.value !== undefined &&
        item.value !== null &&
        item.value !== ''
      ) {
        filterQuery += `&filter_field=${encodeURIComponent(
          item.field
        )}&filter_op=${encodeURIComponent(
          item.operator
        )}&filter_val=${encodeURIComponent(item.value)}`;
      }
    });
  }

  let sortQuery = '';
  if (sortModel?.length > 0) {
    const sortItem = sortModel[0];
    if (sortItem.field && sortItem.sort) {
      sortQuery = `&sort_field=${encodeURIComponent(
        sortItem.field
      )}&sort_dir=${encodeURIComponent(sortItem.sort)}`;
    }
  }

  let groupByQuery = '';
  if (groupByColumns && groupByColumns.length > 0) {
    const encodedGroupBy = groupByColumns
      .map(col => encodeURIComponent(col))
      .join(',');
    groupByQuery = `&group_by_fields=${encodedGroupBy}`;
  }

  let aggregationQuery = '';
  if (aggregations) {
    const aggList = Array.isArray(aggregations) ? aggregations : [aggregations];
    aggList.forEach((agg: any) => {
      if (agg?.col && agg?.func) {
        aggregationQuery += `&aggregation_field=${encodeURIComponent(
          agg.col
        )}&aggregation_op=${encodeURIComponent(agg.func)}`;
      }
    });
  }

  const startIndex = pageIndex * maxResults;
  return `bigQueryPreview?project_id=${projectId}&dataset_id=${dataSetId}&table_id=${tableId}&max_results=${maxResults}&start_index=${startIndex}${filterQuery}${sortQuery}${groupByQuery}${aggregationQuery}`;
};
