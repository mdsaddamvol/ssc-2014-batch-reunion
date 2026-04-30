"use server";

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
if (!uri) throw new Error("MONGODB_URI environment variable is missing");

export async function saveRegistration(formData: FormData) {
	const client = new MongoClient(uri);
	try {
		await client.connect();
		const db = client.db("reunion_db");

		await db.collection("registrations").insertOne({
			name: formData.get("name"),
			phone: formData.get("phone"),
			email: formData.get("email") || null,
			batch: formData.get("batch"),
			attendees: parseInt(formData.get("attendees") as string, 10),
			createdAt: new Date(),
		});

		return { success: true };
	} catch (error) {
		console.error("❌ MongoDB Error:", error);
		return { success: false, error: "ডাটাবেস সংযোগ ব্যর্থ হয়েছে" };
	} finally {
		await client.close(); // কানেকশন ক্লোজ (Vercel Serverless-এ নিরাপদ)
	}
}
