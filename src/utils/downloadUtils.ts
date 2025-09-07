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
            const fileName = `${dishNameForFile}_${folder}_${index + 1}.${extension}`;
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

// Download only processed images for a submission as a ZIP
export const downloadProcessedImagesAsZip = async (
  processedImages: string[],
  dishName?: string
) => {
  try {
    const urls = processedImages || [];
    if (urls.length === 0) {
      throw new Error('אין תמונות מוכנות להורדה');
    }

    const sanitizeFilename = (text: string) =>
      (text || 'תמונות_מוכנות')
        .replace(/[\\\/:*?"<>|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);

    const baseName = sanitizeFilename(dishName || 'תמונות_מוכנות');
    const zipFileName = `${baseName}_processed.zip`;

    const zip = new JSZip();
    const promises: Promise<void>[] = [];

    urls.forEach((url, index) => {
      const p = fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
          return response.blob();
        })
        .then((blob) => {
          const urlParts = url.split('.');
          const extension = urlParts.length > 1 ? (urlParts.pop() as string) : 'jpg';
          const fileName = `${baseName}_processed_${index + 1}.${extension}`;
          const filePath = `processed/${fileName}`;
          zip.file(filePath, blob);
        })
        .catch((error) => {
          console.error(`Error downloading image ${url}:`, error);
        });
      promises.push(p);
    });

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
    console.error('Error creating processed images zip file:', error);
    throw error;
  }
};

// Download all submissions for all clients as organized ZIP file
export const downloadAllClientsSubmissionsAsZip = async (supabase: any) => {
  try {
    console.log('[Bulk Download] Starting bulk download of all client submissions');
    
    // Get all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('client_id, restaurant_name, contact_name, email, phone, original_lead_id')
      .order('restaurant_name');

    if (clientsError) {
      console.error('[Bulk Download] Error fetching clients:', clientsError);
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    if (!clients || clients.length === 0) {
      throw new Error('No clients found');
    }

    console.log(`[Bulk Download] Found ${clients.length} clients`);

    // Get all submissions for all clients
    const allSubmissions: any[] = [];
    let totalImages = 0;

    for (const client of clients) {
      console.log(`[Bulk Download] Processing client: ${client.restaurant_name}`);
      
      // Build query for this client's submissions
      let query = supabase
        .from('customer_submissions')
        .select('*');

      if (client.original_lead_id) {
        // Include submissions from original lead
        query = query.or(`client_id.eq.${client.client_id},lead_id.eq.${client.original_lead_id},created_lead_id.eq.${client.original_lead_id}`);
      } else {
        query = query.eq('client_id', client.client_id);
      }

      const { data: submissions, error: submissionsError } = await query
        .order('uploaded_at', { ascending: false });

      if (submissionsError) {
        console.warn(`[Bulk Download] Error fetching submissions for ${client.restaurant_name}:`, submissionsError);
        continue;
      }

      if (submissions && submissions.length > 0) {
        // Add client context to each submission
        const clientSubmissions = submissions.map(submission => ({
          ...submission,
          client_restaurant_name: client.restaurant_name,
          client_contact_name: client.contact_name,
          client_email: client.email,
          client_phone: client.phone
        }));
        
        allSubmissions.push(...clientSubmissions);
        
        // Count total images
        submissions.forEach(submission => {
          if (submission.original_image_urls?.length) {
            totalImages += submission.original_image_urls.length;
          }
          if (submission.processed_image_urls?.length) {
            totalImages += submission.processed_image_urls.length;
          }
        });
      }
    }

    if (totalImages === 0) {
      throw new Error('No images found in any client submissions');
    }

    console.log(`[Bulk Download] Found ${allSubmissions.length} submissions with ${totalImages} total images`);

    // Create ZIP file organized by client
    const zip = new JSZip();
    const promises: Promise<void>[] = [];
    let processedImages = 0;

    // Group submissions by client
    const submissionsByClient = allSubmissions.reduce((acc, submission) => {
      const clientName = submission.client_restaurant_name || 'Unknown_Client';
      if (!acc[clientName]) {
        acc[clientName] = [];
      }
      acc[clientName].push(submission);
      return acc;
    }, {} as Record<string, any[]>);

    // Process each client's submissions
    for (const [clientName, submissions] of Object.entries(submissionsByClient)) {
      const sanitizedClientName = clientName
        .replace(/[\\\/:*?"<>|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 50);

      console.log(`[Bulk Download] Processing ${submissions.length} submissions for ${sanitizedClientName}`);

      submissions.forEach((submission, submissionIndex) => {
        const submissionId = submission.submission_id?.slice(-8) || `${submissionIndex + 1}`;
        const dishName = submission.item_name_at_submission || `הגשה_${submissionIndex + 1}`;
        const sanitizedDishName = dishName
          .replace(/[\\\/:*?"<>|]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 30);

        const submissionFolder = `${sanitizedClientName}/${sanitizedDishName}_${submissionId}`;

        // Add original images
        const originalImages = submission.original_image_urls || [];
        originalImages.forEach((imageUrl: string, imageIndex: number) => {
          const promise = fetch(imageUrl)
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch image: ${imageUrl}`);
              }
              return response.blob();
            })
            .then(blob => {
              const urlParts = imageUrl.split('.');
              const extension = urlParts.length > 1 ? urlParts.pop() : 'jpg';
              const imageName = `original_${imageIndex + 1}.${extension}`;
              const filePath = `${submissionFolder}/original/${imageName}`;
              zip.file(filePath, blob);
              processedImages++;
              console.log(`[Bulk Download] Progress: ${processedImages}/${totalImages} images processed`);
            })
            .catch(error => {
              console.error(`[Bulk Download] Error downloading original image ${imageUrl}:`, error);
            });
          
          promises.push(promise);
        });

        // Add processed images
        const processedImageUrls = submission.processed_image_urls || [];
        processedImageUrls.forEach((imageUrl: string, imageIndex: number) => {
          const promise = fetch(imageUrl)
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch image: ${imageUrl}`);
              }
              return response.blob();
            })
            .then(blob => {
              const urlParts = imageUrl.split('.');
              const extension = urlParts.length > 1 ? urlParts.pop() : 'jpg';
              const imageName = `processed_${imageIndex + 1}.${extension}`;
              const filePath = `${submissionFolder}/processed/${imageName}`;
              zip.file(filePath, blob);
              processedImages++;
              console.log(`[Bulk Download] Progress: ${processedImages}/${totalImages} images processed`);
            })
            .catch(error => {
              console.error(`[Bulk Download] Error downloading processed image ${imageUrl}:`, error);
            });
          
          promises.push(promise);
        });
      });
    }

    // Wait for all downloads to complete
    console.log('[Bulk Download] Downloading all images...');
    await Promise.all(promises);

    console.log('[Bulk Download] Generating ZIP file...');
    
    // Generate ZIP filename with timestamp
    const timestamp = new Date().toLocaleDateString('he-IL').replace(/\//g, '-');
    const zipFileName = `כל_ההגשות_${timestamp}.zip`;

    // Generate zip file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

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

    console.log('[Bulk Download] Bulk download completed successfully');
    
    return { 
      success: true, 
      totalImages: processedImages, 
      totalSubmissions: allSubmissions.length,
      totalClients: clients.length
    };
  } catch (error) {
    console.error('[Bulk Download] Error creating bulk download zip file:', error);
    throw error;
  }
};