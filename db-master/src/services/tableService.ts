import { functions } from "../firebase/functions.real";
import { getUserFriendlyErrorMessage, logError } from "../utils/errorUtils";
import { useToast } from "../context/ToastContext";

/**
 * Update a row in a table
 * @param connectionId Connection ID
 * @param tableName Table name
 * @param primaryKeyColumn Primary key column name
 * @param primaryKeyValue Primary key value
 * @param updatedData Updated row data
 * @returns Promise with update result
 */
export const updateTableRow = async (
  connectionId: string,
  tableName: string,
  primaryKeyColumn: string,
  primaryKeyValue: any,
  updatedData: Record<string, any>
) => {
  try {
    // Simple validation
    if (!connectionId || !tableName || !primaryKeyColumn || primaryKeyValue === undefined || !updatedData) {
      throw new Error("필수 파라미터가 누락되었습니다.");
    }

    // Don't allow updating primary key
    if (updatedData[primaryKeyColumn] !== undefined && 
        updatedData[primaryKeyColumn] !== primaryKeyValue) {
      throw new Error("기본 키 컬럼은 수정할 수 없습니다.");
    }

    // Call the Firebase Function
    const result = await functions.updateTableRow({
      connectionId,
      tableName,
      primaryKeyColumn,
      primaryKeyValue,
      updatedData
    });

    return result.data;
  } catch (error) {
    const errorMessage = getUserFriendlyErrorMessage(error);
    logError(error, 'updateTableRow');
    
    // Use toast if available in context
    const toast = useToast();
    if (toast?.showToast) {
      toast.showToast(`행 업데이트 실패: ${errorMessage}`, 'error');
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Insert a new row into a table
 * @param connectionId Connection ID
 * @param tableName Table name
 * @param rowData Row data to insert
 * @returns Promise with insert result
 */
export const insertTableRow = async (
  connectionId: string,
  tableName: string,
  rowData: Record<string, any>
) => {
  try {
    // Simple validation
    if (!connectionId || !tableName || !rowData) {
      throw new Error("필수 파라미터가 누락되었습니다.");
    }

    // Call the Firebase Function
    const result = await functions.insertTableRow({
      connectionId,
      tableName,
      rowData
    });

    return result.data;
  } catch (error) {
    const errorMessage = getUserFriendlyErrorMessage(error);
    logError(error, 'insertTableRow');
    
    // Use toast if available in context
    const toast = useToast();
    if (toast?.showToast) {
      toast.showToast(`행 삽입 실패: ${errorMessage}`, 'error');
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Delete a row from a table
 * @param connectionId Connection ID
 * @param tableName Table name
 * @param primaryKeyColumn Primary key column name
 * @param primaryKeyValue Primary key value
 * @returns Promise with delete result
 */
export const deleteTableRow = async (
  connectionId: string,
  tableName: string,
  primaryKeyColumn: string,
  primaryKeyValue: any
) => {
  try {
    // Simple validation
    if (!connectionId || !tableName || !primaryKeyColumn || primaryKeyValue === undefined) {
      throw new Error("필수 파라미터가 누락되었습니다.");
    }

    // Call the Firebase Function
    const result = await functions.deleteTableRow({
      connectionId,
      tableName,
      primaryKeyColumn,
      primaryKeyValue
    });

    return result.data;
  } catch (error) {
    const errorMessage = getUserFriendlyErrorMessage(error);
    logError(error, 'deleteTableRow');
    
    // Use toast if available in context
    const toast = useToast();
    if (toast?.showToast) {
      toast.showToast(`행 삭제 실패: ${errorMessage}`, 'error');
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
};