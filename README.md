docboox
===

A featured documents gallery api that supports customization on docx templates stored in S3.

### Features
- JWT authentication
- List docs in an S3 bucket.
- Text replacement in docx templates with query params.
- Download files.
- (upcoming) Upload files.
- (upcoming) Excel, PowerPoint processing.


### API

**GET /api/docs**

Lists files in bucket.

**GET /api/docs/:name**

Downloads file with given name.

**GET /api/docs/:name?foo=bar&baz=qux**

Replaces {foo} with bar and {baz} with qux in docx document with given name and downloads it.

### Environment Variables

While in development, you can add a `.env` file containing following variables:

```
MINIO_SSL=1
MINIO_ENDPOINT=some-minio.com
MINIO_ACCESS_KEY=access_key
MINIO_SECRET_KEY=secret_key
BUCKET=dockboox
```