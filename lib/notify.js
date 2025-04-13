import axios from 'axios';

/**
 * Sends a POST request notification to the specified webhook URL.
 * @param {string} url - The webhook URL to send the notification to.
 */
export async function sendNotification(url) {
  console.log(`🚀 Sending notification to webhook: ${url}`);
  try {
    const response = await axios.get(url);
    
    // Axios throws for non-2xx responses, so we just need to catch errors.
    console.log("Webhook notification sent successfully.");
    return true; // Indicate success
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Webhook notification failed: ${error.response.status} ${error.response.statusText}`);
      console.error(`Response data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`Error sending webhook notification: No response received from ${url}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`Error sending webhook notification: ${error.message}`);
    }
    return false; // Indicate failure
  }
} 