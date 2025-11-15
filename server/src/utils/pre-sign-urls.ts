import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const preSignUrls = async (relativeUrls: string[], client: S3Client) => {
  await Promise.all(
    relativeUrls.map(async (relativeUrl) => {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: relativeUrl,
      });
      const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      console.log(`Pre-signed URL for ${relativeUrl}: ${presignedUrl}`);
      return presignedUrl;
    })
  )
}
