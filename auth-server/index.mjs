import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import Jimp from "jimp";


const DEST_BUCKET = process.env.DEST_BUCKET;
const THUMBNAIL_WIDTH = 200; // px
const SUPPORTED_FORMATS = {
  jpg: true,
  jpeg: true,
  png: true,
};


export const handler = async (event, context,callback) => {
  const { eventTime, s3 } = event.Records[0];
  const srcBucket = s3.bucket.name;
  const key = s3.object.key;
  console.log ("Hello source bucket ");

  // Object key may have spaces or unicode non-ASCII characters
  const srcKey = decodeURIComponent(s3.object.key.replace(/\+/g, " "));
  const ext = srcKey.replace(/^.*\./, "").toLowerCase();

  console.log(`${eventTime} - ${srcBucket}/${srcKey}`);

  if (!SUPPORTED_FORMATS[ext]) {
    console.log(`ERROR: Unsupported file type (${ext})`);
    return;
  }

  // Get the image from the source bucket
  try {
    // Read the image from S3
    const image = await Jimp.read(`https://${srcBucket}.s3.amazonaws.com/${key}`);

    // Resize the image (e.g., to 300x300 pixels)
    image.resize(300, 300);

    // Convert the image to a Buffer
    const resizedImageBuffer = await image.getBufferAsync(Jimp.AUTO);
    const s3Client = new S3Client();
    // Upload the resized image to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: "zack-lambda-bucket-dest",
        Key: srcKey, // Use the same key as the original image
        Body: resizedImageBuffer,
        ContentType: 'image/jpeg',
      })
    );
   
    callback(null, 'Image resized and uploaded successfully!');
} catch (error) {
    console.error('Error:', error);
    callback(error);
}
};
