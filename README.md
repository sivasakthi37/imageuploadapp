# Image Upload Application

A full-stack web application that allows users to upload and download images using Node.js, Express, MongoDB, and AWS S3.

## Features

- Image upload to AWS S3
- Secure image viewing with presigned URLs
- Image metadata storage in MongoDB
- Real-time upload progress tracking
- Responsive image gallery
- File size display and formatting

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB (for metadata)
- **Storage**: AWS S3 (for images)
- **Frontend**: HTML, CSS, JavaScript
- **Dependencies**: 
  - express
  - mongoose
  - multer
  - @aws-sdk/client-s3
  - @aws-sdk/s3-request-presigner
  - dotenv
  - cors

## Prerequisites

1. Node.js and npm installed
2. MongoDB installed and running
3. AWS account with S3 access
4. S3 bucket created with appropriate permissions

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/imageUploadDB
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=your-region
   AWS_BUCKET_NAME=your-bucket-name
   ```

4. Make sure MongoDB is running:
   ```bash
   # Check MongoDB status
   sudo service mongodb status
   
   # Start MongoDB if not running
   sudo service mongodb start
   ```

5. Start the application:
   ```bash
   npm start
   ```

6. Access the application at `http://localhost:3000`

## API Endpoints

### Upload Image
- **URL**: `/api/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Request Body**: Form data with 'image' field
- **Response**: JSON object with upload status and file metadata

### Get All Images
- **URL**: `/api/images`
- **Method**: `GET`
- **Response**: Array of image metadata with presigned URLs

### Get Single Image
- **URL**: `/api/images/:filename`
- **Method**: `GET`
- **Response**: Redirects to presigned S3 URL

## AWS S3 Configuration

1. Create an S3 bucket in your AWS account
2. Configure CORS for your bucket:
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "POST", "PUT"],
           "AllowedOrigins": ["*"],
           "ExposeHeaders": []
       }
   ]
   ```
3. Ensure your AWS user has appropriate permissions:
   - s3:PutObject
   - s3:GetObject
   - s3:ListBucket

## Implementation Details

- Uses Multer for handling file uploads
- Implements AWS S3 for scalable image storage
- MongoDB stores image metadata for quick retrieval
- Generates secure presigned URLs for image access
- Frontend displays real-time upload progress
- Responsive image grid with file information


## Error Handling

The application includes error handling for:
- Invalid file types
- Upload failures
- Database connection issues
- S3 access errors
- Missing environment variables

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
