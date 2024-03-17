function readSplatFile(url, callback) {
    fetch(url)
        .then(response => response.arrayBuffer())
        .then(buffer => {
            const dataView = new DataView(buffer);
            const splats = [];
            const splatSize = 32; 

            for (let offset = 0; offset < dataView.byteLength; offset += splatSize) {
                const position = [
                    dataView.getFloat32(offset, true),
                    dataView.getFloat32(offset + 4, true),
                    dataView.getFloat32(offset + 8, true)
                ];

                const scale = [
                    dataView.getFloat32(offset + 12, true),
                    dataView.getFloat32(offset + 16, true),
                    dataView.getFloat32(offset + 20, true)
                ];

                const color = [
                    dataView.getUint8(offset + 24) / 255,
                    dataView.getUint8(offset + 25) / 255,
                    dataView.getUint8(offset + 26) / 255,
                    dataView.getUint8(offset + 27) / 255
                ];

                const rotation = [
                    (dataView.getUint8(offset + 28) - 128) / 128,
                    (dataView.getUint8(offset + 29) - 128) / 128,
                    (dataView.getUint8(offset + 30) - 128) / 128,
                    (dataView.getUint8(offset + 31) - 128) / 128
                ];

                splats.push({ position, scale, color, rotation });
            }

            callback(splats);
        })
        .catch(err => console.error('Failed to load splat file:', err));
}
