export const env = {
	db: {
		url:
			process.env.DATABASE_URL ||
			"postgresql://user:password@localhost:5432/elysia_db?schema=public",
	},
	app: {
		port: Number(process.env.PORT || 8080),
		env: process.env.NODE_ENV || "development",
	},
	jwt: {
		secret: process.env.JWT_SECRET || "super-secret-key-change-me",
	},
	google: {
		projectId: process.env.GCP_PROJECT_ID || "",
		gcsClientEmail: process.env.GCS_CLIENT_EMAIL || "",
		gcsPrivateKey: process.env.GCS_PRIVATE_KEY || "",
		gcsBucket: process.env.GCS_BUCKET || "",
		gcsFolder: process.env.GCS_FOLDER || "",
		gcsUrl: process.env.URL || "https://storage.googleapis.com",
	}
};
