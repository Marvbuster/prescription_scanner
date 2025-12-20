#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ZXING_DIR="$SCRIPT_DIR/zxing-cpp"
BUILD_DIR="$SCRIPT_DIR/build"
OUTPUT_DIR="$SCRIPT_DIR"

echo "============================================"
echo "PRESCRIPTION SCANNER - WASM Build"
echo "Formate: DataMatrix, QRCode"
echo "============================================"

# Clone zxing-cpp if not present (use same commit as zxing-wasm)
if [ ! -d "$ZXING_DIR" ]; then
    echo ">>> Cloning zxing-cpp..."
    git clone https://github.com/zxing-cpp/zxing-cpp.git "$ZXING_DIR"
    cd "$ZXING_DIR"
    git checkout fba4e9503fee4518ca2e89510baeea9bcc36dc8d
    cd "$SCRIPT_DIR"
fi

# Clean build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Configure CMake - ALL 4 FORMATS
echo ">>> Configuring CMake..."
emcmake cmake "$ZXING_DIR" \
  -DCMAKE_BUILD_TYPE=MinSizeRel \
  -DBUILD_SHARED_LIBS=OFF \
  -DZXING_READERS=ON \
  -DZXING_WRITERS=OFF \
  -DZXING_ENABLE_1D=OFF \
  -DZXING_ENABLE_AZTEC=OFF \
  -DZXING_ENABLE_DATAMATRIX=ON \
  -DZXING_ENABLE_MAXICODE=OFF \
  -DZXING_ENABLE_PDF417=OFF \
  -DZXING_ENABLE_QRCODE=ON \
  -DZXING_C_API=OFF \
  -DZXING_UNIT_TESTS=OFF \
  -DZXING_EXAMPLES=OFF

# Build
echo ">>> Building zxing-cpp..."
cmake --build . --config MinSizeRel -j$(sysctl -n hw.ncpu)

# Create JS bindings
echo ">>> Creating WASM bindings..."
cat > "$BUILD_DIR/bindings.cpp" << 'EOF'
#include "ReadBarcode.h"
#include <emscripten/bind.h>
#include <string>
#include <vector>

using namespace ZXing;

struct ScanResult {
    std::string text;
    std::string format;
    std::string error;
    int x0, y0, x1, y1, x2, y2, x3, y3;
};

std::vector<ScanResult> scan(uintptr_t ptr, int width, int height) {
    try {
        ReaderOptions opts;
        opts.setFormats(
            BarcodeFormat::DataMatrix |
            BarcodeFormat::QRCode
        );
        opts.setTryHarder(true);
        opts.setTryRotate(true);
        opts.setTryInvert(true);
        opts.setTryDownscale(true);
        opts.setIsPure(false);
        opts.setMaxNumberOfSymbols(10);

        ImageView iv(reinterpret_cast<uint8_t*>(ptr), width, height, ImageFormat::RGBA);
        auto barcodes = ReadBarcodes(iv, opts);

        std::vector<ScanResult> results;
        for (auto& bc : barcodes) {
            ScanResult r;
            r.text = bc.text();
            r.format = ToString(bc.format());
            r.error = ToString(bc.error());
            auto p = bc.position();
            r.x0 = p[0].x; r.y0 = p[0].y;
            r.x1 = p[1].x; r.y1 = p[1].y;
            r.x2 = p[2].x; r.y2 = p[2].y;
            r.x3 = p[3].x; r.y3 = p[3].y;
            results.push_back(r);
        }
        return results;
    } catch (...) {
        return {};
    }
}

EMSCRIPTEN_BINDINGS(scanner) {
    using namespace emscripten;
    value_object<ScanResult>("ScanResult")
        .field("text", &ScanResult::text)
        .field("format", &ScanResult::format)
        .field("error", &ScanResult::error)
        .field("x0", &ScanResult::x0).field("y0", &ScanResult::y0)
        .field("x1", &ScanResult::x1).field("y1", &ScanResult::y1)
        .field("x2", &ScanResult::x2).field("y2", &ScanResult::y2)
        .field("x3", &ScanResult::x3).field("y3", &ScanResult::y3);
    register_vector<ScanResult>("vector<ScanResult>");
    function("scan", &scan);
}
EOF

# Compile to WASM
echo ">>> Compiling to WASM..."
em++ "$BUILD_DIR/bindings.cpp" \
  -I"$ZXING_DIR/core/src" \
  -I"$BUILD_DIR/core" \
  "$BUILD_DIR/core/libZXing.a" \
  -std=c++20 \
  -Os -flto \
  --bind \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME='createScanner' \
  -s ENVIRONMENT='web' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s FILESYSTEM=0 \
  -s DYNAMIC_EXECUTION=0 \
  -s DISABLE_EXCEPTION_CATCHING=0 \
  -s EXPORTED_FUNCTIONS='["_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["HEAPU8"]' \
  -o "$OUTPUT_DIR/scanner.js"

echo ""
echo "============================================"
echo "BUILD COMPLETE"
echo "============================================"
ls -lh "$OUTPUT_DIR/scanner."*
echo ""
echo "Formate: DataMatrix, QRCode"
