interface ImageCapture {
	grabFrame(): Promise<ImageBitmap>;
	getPhotoCapabilities(): Promise<unknown>;
	getPhotoSettings(): Promise<unknown>;
	takePhoto(photoSettings?: unknown): Promise<Blob>;
	readonly track: MediaStreamTrack;
}

declare var ImageCapture: {
	prototype: ImageCapture;
	new (videoTrack: MediaStreamTrack): ImageCapture;
};
