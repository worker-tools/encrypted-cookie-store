// Buffer Source Conversion
// ------------------------

export const bufferSourceToUint8Array = (bs: BufferSource) => bs instanceof ArrayBuffer
  ? new Uint8Array(bs)
  : new Uint8Array(bs.buffer, bs.byteOffset, bs.byteLength);

export const bufferSourceToDataView = (bs: BufferSource) => bs instanceof ArrayBuffer
  ? new DataView(bs)
  : new DataView(bs.buffer, bs.byteOffset, bs.byteLength);

const bs2u8 = bufferSourceToUint8Array;
const bs2dv = bufferSourceToDataView;


// Hex Functions
// -------------

export const byteToHex = (byte: number) => byte.toString(16).padStart(2, '0');
export const hexToByte = (hexOctet: string) => parseInt(hexOctet, 16);

export const hexStringToBytes = (hexString: string) => new Uint8Array(hexString.match(/[0-9a-f]{1,2}/ig)!.map(hexToByte));
export const bytesToHexString = (bufferSource: BufferSource) => Array.from(bs2u8(bufferSource), byte => byteToHex(byte)).join('');

export const bytesToHexArray = (bufferSource: BufferSource) => Array.from(bs2u8(bufferSource), byte => byteToHex(byte));


// Concatenation
// -------------

export function concatUint8Arrays(...uint8Arrays: Uint8Array[]) {
  const size = uint8Arrays.reduce((size, u8) => size + u8.length, 0);
  const res = new Uint8Array(size);
  let i = 0;
  for (const u8 of uint8Arrays) {
    res.set(u8, i);
    i += u8.length;
  }
  return res;
}

export function concatBufferSources(...bufferSources: BufferSource[]) {
  return concatUint8Arrays(...bufferSources.map(bs2u8));
}

// Splitting
// ---------

export function splitUint8Array(uint8Array: Uint8Array, ...indices: number[]) {
  const result: Uint8Array[] = new Array(indices.length + 1);
  let prev = 0;
  let i = 0;
  for (const index of indices) {
    result[i++] = uint8Array.subarray(prev, index);
    prev = index;
  }
  result[i] = uint8Array.subarray(prev);
  return result;
}

export function splitBufferSource(bufferSource: BufferSource, ...indices: number[]) {
  return splitUint8Array(bs2u8(bufferSource), ...indices);
}


// Comparison
// ----------

export function compareUint8Arrays(u8_1: Uint8Array, ...u8s: Uint8Array[]) {
  if (u8s.some(u8_i => u8_1.byteLength !== u8_i.byteLength)) return false;
  let res = true;
  for (const u8_i of u8s) {
    for (let i = 0; i !== u8_1.length; i++) {
      const r = u8_1[i] === u8_i[i];
      res = r && res;
    }
  }
  return res;
}

function compareDataViewsUint32(dv_1: DataView, ...dvs: DataView[]) {
  if (dvs.some(dv_i => dv_1.byteLength !== dv_i.byteLength)) return false;
  let res = true;
  for (const dv_i of dvs) {
    for (let i = 0; i !== dv_1.byteLength; i += 4) {
      const r = dv_1.getUint32(i) === dv_i.getUint32(i);
      res = r && res;
    }
  }
  return res;
}

export function compareBufferSources(bufferSource: BufferSource, ...bufferSources: BufferSource[]) {
  return compareDataViewsUint32(bs2dv(bufferSource), ...bufferSources.map(bs2dv));
}

export function unsafeCompareUint8Arrays(u8_1: Uint8Array, ...u8s: Uint8Array[]) {
  if (u8s.some(u8_i => u8_1.byteLength !== u8_i.byteLength)) return false;
  return u8s.every(u8_i => {
    for (let i = 0; i !== u8_1.length; i++) if (u8_1[i] !== u8_i[i]) return false;
    return true;
  });
}

function unsafeCompareDataViewsUint32(dv_1: DataView, ...dvs: DataView[]) {
  if (dvs.some((dv_i) => dv_1.byteLength !== dv_i.byteLength)) return false;
  return dvs.every(dv_i => {
    for (let i = 0; i !== dv_i.byteLength; i += 4) {
      if (dv_1.getUint32(i) !== dv_i.getUint32(i)) {
        return false;
      }
    }
    return true;
  });
}

export function unsafeCompareBufferSources(bufferSource: BufferSource, ...bufferSources: BufferSource[]) {
  return unsafeCompareDataViewsUint32(bs2dv(bufferSource), ...bufferSources.map(bs2dv));
}