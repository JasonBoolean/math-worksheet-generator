#!/bin/bash

# Offline Package Creation Script
# Creates a distributable offline package of the Math Worksheet Generator

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PACKAGE_NAME="math-worksheet-generator-offline"
VERSION=$(node -p "require('./package.json').version")
BUILD_DIR="dist"
PACKAGE_DIR="offline-package"
OUTPUT_FILE="${PACKAGE_NAME}-v${VERSION}.zip"

echo -e "${BLUE}📦 Creating Offline Package${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}\n"

# Step 1: Build the project
echo -e "${BLUE}[1/6]${NC} Building project..."
npm run build
echo -e "${GREEN}✓${NC} Build completed\n"

# Step 2: Create package directory
echo -e "${BLUE}[2/6]${NC} Creating package directory..."
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"
echo -e "${GREEN}✓${NC} Package directory created\n"

# Step 3: Copy build files
echo -e "${BLUE}[3/6]${NC} Copying build files..."
cp -r "$BUILD_DIR"/* "$PACKAGE_DIR/"
echo -e "${GREEN}✓${NC} Build files copied\n"

# Step 4: Add documentation
echo -e "${BLUE}[4/6]${NC} Adding documentation..."
cp OFFLINE_PACKAGE_README.md "$PACKAGE_DIR/README.md"
cp USER_GUIDE.md "$PACKAGE_DIR/"
cp LICENSE "$PACKAGE_DIR/" 2>/dev/null || echo "MIT License" > "$PACKAGE_DIR/LICENSE"
echo -e "${GREEN}✓${NC} Documentation added\n"

# Step 5: Create version info
echo -e "${BLUE}[5/6]${NC} Creating version info..."
cat > "$PACKAGE_DIR/VERSION.txt" << EOF
Math Worksheet Generator - Offline Package
Version: ${VERSION}
Build Date: $(date +"%Y-%m-%d %H:%M:%S")
Package Type: Offline Deployment

System Requirements:
- Modern web browser (Chrome 80+, Firefox 78+, Safari 13+, Edge 80+)
- HTTP server (Python, Node.js, PHP, or any web server)
- 100 MB disk space

Quick Start:
1. Extract this package
2. Run: python -m http.server 8080
3. Open: http://localhost:8080

For detailed instructions, see README.md
EOF
echo -e "${GREEN}✓${NC} Version info created\n"

# Step 6: Create ZIP package
echo -e "${BLUE}[6/6]${NC} Creating ZIP package..."
cd "$PACKAGE_DIR"
zip -r "../$OUTPUT_FILE" . -q
cd ..
echo -e "${GREEN}✓${NC} ZIP package created\n"

# Calculate package size
PACKAGE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

# Summary
echo -e "${GREEN}✨ Offline package created successfully!${NC}\n"
echo -e "${BLUE}📊 Package Information:${NC}"
echo -e "  Name: ${OUTPUT_FILE}"
echo -e "  Size: ${PACKAGE_SIZE}"
echo -e "  Location: $(pwd)/${OUTPUT_FILE}"
echo -e "\n${BLUE}📦 Distribution:${NC}"
echo -e "  1. Share the ZIP file with users"
echo -e "  2. Users extract and run a local server"
echo -e "  3. Access via browser at localhost"
echo -e "\n${BLUE}📖 Documentation:${NC}"
echo -e "  - README.md: Quick start guide"
echo -e "  - USER_GUIDE.md: Complete user manual"
echo -e "  - VERSION.txt: Version information"
echo -e "\n${GREEN}Ready for distribution!${NC}\n"

# Cleanup option
read -p "$(echo -e ${YELLOW}Clean up temporary files? [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${BLUE}Cleaning up...${NC}"
    rm -rf "$PACKAGE_DIR"
    echo -e "${GREEN}✓${NC} Cleanup completed"
fi

echo -e "\n${GREEN}Done!${NC}"
