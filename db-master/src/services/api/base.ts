import { functions } from '../../firebase/config';

/**
 * Base API class for server communications
 * 
 * Provides common functionality for making API calls to Firebase Cloud Functions
 */
class BaseApi {
  /**
   * Call a Firebase Cloud Function
   * 
   * @param functionName - Name of the function to call
   * @param data - Data to pass to the function
   * @returns Promise with the function result
   */
  protected async callFunction<TData, TResult>(
    functionName: string,
    data?: TData
  ): Promise<TResult> {
    try {
      // Use Firebase functions to call the cloud function
      const callable = functions.httpsCallable(functionName);
      const response = await callable(data || {});
      
      // Return the data property of the response
      return response.data as TResult;
    } catch (error) {
      console.error(`Error calling function ${functionName}:`, error);
      throw error;
    }
  }
}

export default BaseApi;
