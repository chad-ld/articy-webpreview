# Articy Web Viewer - Branching Strategy

This document outlines the branching strategy for maintaining two versions of the Articy Web Viewer to support both Articy Draft 3.x and Articy Draft X (4.x).

## Branch Structure

```
main (stable releases)
├── v3.x (Articy Draft 3.x support - stable)
│   ├── dev-v3 (development for 3.x features)
│   └── feature branches for 3.x (feature/v3-*)
└── v4.x (Articy Draft X/4.x support - stable)
    ├── dev-v4 (development for 4.x features)
    └── feature branches for 4.x (feature/v4-*)
```

## Version Information

### v3.x Branch
- **Purpose**: Supports Articy Draft 3.x JSON format
- **Version**: 3.1.0+
- **Description**: "Articy Draft 3.x Web Preview - JSON viewer for Articy Draft 3.x series"
- **Deployment**: https://dev.chadbriggs.com/articy/v3/
- **Deployment Script**: `deploy-to-sftp-winscp-v3.bat`

### v4.x Branch
- **Purpose**: Supports Articy Draft X (4.x) JSON format
- **Version**: 4.0.0-alpha.1+
- **Description**: "Articy Draft X (4.x) Web Preview - JSON viewer for Articy Draft X series"
- **Deployment**: https://dev.chadbriggs.com/articy/v4/
- **Deployment Script**: `deploy-to-sftp-winscp-v4.bat`

## Workflow

### For v3.x Maintenance
1. Work in `dev-v3` branch
2. Create feature branches from `dev-v3`: `feature/v3-feature-name`
3. Merge feature branches back to `dev-v3`
4. When ready for release, merge `dev-v3` to `v3.x`
5. Tag releases as `v3.1.0`, `v3.1.1`, `v3.2.0`, etc.
6. Deploy using `deploy-to-sftp-winscp-v3.bat`

### For v4.x Development
1. Work in `dev-v4` branch
2. Create feature branches from `dev-v4`: `feature/v4-feature-name`
3. Merge feature branches back to `dev-v4`
4. When ready for release, merge `dev-v4` to `v4.x`
5. Tag releases as `v4.0.0-alpha.1`, `v4.0.0-beta.1`, `v4.0.0`, etc.
6. Deploy using `deploy-to-sftp-winscp-v4.bat`

## Git Commands Reference

### Switch to v3.x development
```bash
git checkout dev-v3
git pull origin dev-v3
```

### Switch to v4.x development
```bash
git checkout dev-v4
git pull origin dev-v4
```

### Create feature branch for v3.x
```bash
git checkout dev-v3
git checkout -b feature/v3-your-feature-name
```

### Create feature branch for v4.x
```bash
git checkout dev-v4
git checkout -b feature/v4-your-feature-name
```

### Release v3.x
```bash
git checkout v3.x
git merge dev-v3
git tag v3.1.1
git push origin v3.x --tags
```

### Release v4.x
```bash
git checkout v4.x
git merge dev-v4
git tag v4.0.0-alpha.2
git push origin v4.x --tags
```

## Deployment

Each version has its own deployment script and target directory:

- **v3.x**: Run `deploy-to-sftp-winscp-v3.bat` to deploy to `/articy/v3/`
- **v4.x**: Run `deploy-to-sftp-winscp-v4.bat` to deploy to `/articy/v4/`

## Notes

- Both versions can be maintained simultaneously
- Bug fixes can be applied to both versions as needed
- The `main` branch will eventually point to the most current stable version
- Use GitHub labels `v3.x` and `v4.x` for issue tracking
- Each version maintains its own package.json with appropriate version numbers and descriptions
