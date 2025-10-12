# File Upload Planning

## Profile Image

- Single file, small size limit (1-2MB), image formats only (JPEG/PNG/WebP)
- Immediate validation for dimensions/aspect ratio, optimize/compress before storage
- Replace existing file on update, public access for display in app

## Group Image

- Single file per group, moderate size (2-3MB), same image format validation
- Authorization check (only group admins can upload), versioning for updates
- group-member-only access

## Document Archives

- Multiple files, larger sizes (5-10MB each), various formats (PDF, DOC, images)
- Virus scanning required, organize by trip/folder structure, track metadata (uploader, date)
- Permission-based access, support for bulk operations and file history/versions
