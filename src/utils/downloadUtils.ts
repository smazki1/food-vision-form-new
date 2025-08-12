import JSZip from 'jszip';

export const downloadImagesAsZip = async (imageUrls: string[], zipFileName: string = 'images.zip') => {
  try {
    const zip = new JSZip();
    const promises: Promise<void>[] = [];

    imageUrls.forEach((url, index) => {
      const promise = fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${url}`);
          }
          return response.blob();
        })
        .then(blob => {
          // Extract file extension from URL or default to jpg
          const urlParts = url.split('.');
          const extension = urlParts.length > 1 ? urlParts.pop() : 'jpg';
          const fileName = `image_${index + 1}.${extension}`;
          zip.file(fileName, blob);
        })
        .catch(error => {
          console.error(`Error downloading image ${url}:`, error);
          // Continue with other images even if one fails
        });
      
      promises.push(promise);
    });

    // Wait for all downloads to complete
    await Promise.all(promises);

    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Create download link
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    console.error('Error creating zip file:', error);
    throw error;
  }
};

export const downloadSingleImage = async (imageUrl: string, fileName?: string) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${imageUrl}`);
    }
    
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    
    // Generate filename if not provided
    const finalFileName = fileName || `image_${Date.now()}.${imageUrl.split('.').pop() || 'jpg'}`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
};

// New function to download all lead submissions as organized ZIP file
export const downloadLeadSubmissionsAsZip = async (
  submissions: any[], 
  leadInfo: { restaurant_name?: string; contact_name?: string } = {}
) => {
  try {
    if (!submissions || submissions.length === 0) {
      throw new Error('אין הגשות להורדה');
    }

    const zip = new JSZip();
    const promises: Promise<void>[] = [];
    let totalImages = 0;

    // Calculate total images for progress
    submissions.forEach(submission => {
      if (submission.original_image_urls?.length) {
        totalImages += submission.original_image_urls.length;
      }
    });

    if (totalImages === 0) {
      throw new Error('אין תמונות מקור להורדה');
    }

    // Process each submission
    submissions.forEach((submission, submissionIndex) => {
      const originalImages = submission.original_image_urls || [];
      
      if (originalImages.length === 0) return;

      // Create folder name: submission name + ID
      const submissionId = submission.submission_id?.slice(-8) || `${submissionIndex + 1}`;
      const dishName = submission.item_name_at_submission || `הגשה_${submissionIndex + 1}`;
      const folderName = `${dishName}_${submissionId}`;

      // Download each image in this submission
      originalImages.forEach((imageUrl: string, imageIndex: number) => {
        const promise = fetch(imageUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${imageUrl}`);
            }
            return response.blob();
          })
          .then(blob => {
            // Extract file extension from URL or default to jpg
            const urlParts = imageUrl.split('.');
            const extension = urlParts.length > 1 ? urlParts.pop() : 'jpg';
            const imageName = `${dishName}_${imageIndex + 1}.${extension}`;
            const filePath = `${folderName}/${imageName}`;
            
            zip.file(filePath, blob);
          })
          .catch(error => {
            console.error(`Error downloading image ${imageUrl}:`, error);
            // Continue with other images even if one fails
          });
        
        promises.push(promise);
      });
    });

    // Wait for all downloads to complete
    await Promise.all(promises);

    // Generate ZIP filename
    const restaurantName = leadInfo.restaurant_name || 'ליד';
    const timestamp = new Date().toLocaleDateString('he-IL').replace(/\//g, '-');
    const zipFileName = `${restaurantName}_הגשות_${timestamp}.zip`;

    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Create download link
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(downloadUrl);

    return { success: true, totalImages, submissionsCount: submissions.length };
  } catch (error) {
    console.error('Error creating lead submissions zip file:', error);
    throw error;
  }
}; 

// Download all images for a single submission (both original and processed) as a ZIP
export const downloadSubmissionImagesAsZip = async (submission: any) => {
  try {
    if (!submission) {
      throw new Error('Submission is required');
    }

    const originalImages: string[] = submission.original_image_urls || [];
    const processedImages: string[] = submission.processed_image_urls || [];

    if (originalImages.length === 0 && processedImages.length === 0) {
      throw new Error('אין תמונות להורדה להגשה זו');
    }

    const sanitizeFilename = (text: string) =>
      (text || 'הגשה')
        .replace(/[\\\/:*?"<>|]/g, ' ') // keep Hebrew, remove illegal filename chars
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);

    const rawDishName: string = submission.item_name_at_submission || 'הגשה';
    const dishNameForFile = sanitizeFilename(rawDishName);
    const zipFileName = `${dishNameForFile}.zip`;

    const zip = new JSZip();
    const promises: Promise<void>[] = [];

    const addImages = (urls: string[], folder: string) => {
      if (!urls || urls.length === 0) return;
      urls.forEach((url, index) => {
        const p = fetch(url)
          .then(response => {
            if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
            return response.blob();
          })
          .then(blob => {
            const urlParts = url.split('.');
            const extension = urlParts.length > 1 ? (urlParts.pop() as string) : 'jpg';
            const fileName = `${folder}_${index + 1}.${extension}`;
            const filePath = `${folder}/${fileName}`;
            zip.file(filePath, blob);
          })
          .catch(error => {
            console.error(`Error downloading image ${url}:`, error);
          });
        promises.push(p);
      });
    };

    addImages(originalImages, 'original');
    addImages(processedImages, 'processed');

    await Promise.all(promises);

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    console.error('Error creating submission zip file:', error);
    throw error;
  }
};