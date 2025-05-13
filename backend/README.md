# R-Mart Backend

## S3 Image Upload Configuration

The application uses AWS S3 for storing product images. To configure this functionality:

1. Create an AWS account if you don't have one already
2. Create an S3 bucket for storing the images
3. Create an IAM user with programmatic access and permissions to access the S3 bucket
4. Make your bucket objects publicly accessible using a bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

5. Add the following environment variables to your `.env` file:

```
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_aws_region (e.g., us-east-1, eu-west-1)
AWS_S3_BUCKET_NAME=your_bucket_name
```

### Important S3 Bucket Settings

The implementation works with buckets that have ACLs (Access Control Lists) disabled, which is the default for new S3 buckets. If your bucket has ACLs enabled, you'll need to either:

1. Disable ACLs in your bucket properties (recommended)
2. Or modify the `utils/s3.js` file to add back the `acl: 'public-read'` property and ensure the bucket allows this ACL setting

## Database Migration

After setting up the AWS S3 configuration, run the following commands to migrate existing data:

```
npm run migrate:images
```

This will:
1. Add an `images` column to the products table (if it doesn't exist already)
2. Migrate existing image URLs to the new images array format

## Running the Application

```
npm run dev
``` 