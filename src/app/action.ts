"use server";

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI environment variable is missing");

// Singleton pattern
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
	const globalWithMongo = global as typeof globalThis & {
		_mongoClientPromise?: Promise<MongoClient>;
	};
	if (!globalWithMongo._mongoClientPromise) {
		client = new MongoClient(uri);
		globalWithMongo._mongoClientPromise = client.connect();
	}
	clientPromise = globalWithMongo._mongoClientPromise;
} else {
	client = new MongoClient(uri);
	clientPromise = client.connect();
}
// 🔹 Fetch all registrations with optional search
export async function getRegistrations(searchQuery?: string) {
	try {
		const client = await clientPromise;
		const db = client.db("reunion_db");

		const query = searchQuery
			? {
					$or: [
						{ name: { $regex: searchQuery, $options: "i" } },
						{ phone: { $regex: searchQuery, $options: "i" } },
						{ email: { $regex: searchQuery, $options: "i" } },
					],
				}
			: {};

		const registrations = await db
			.collection("registrations")
			.find(query)
			.sort({ registeredAt: -1 })
			.toArray();

		// Convert ObjectId to string for serialization
		return JSON.parse(JSON.stringify(registrations));
	} catch (error) {
		console.error("❌ Fetch Error:", error);
		return [];
	}
}

// 🔹 Toggle confirmation status
export async function toggleConfirmation(id: string, newStatus: boolean) {
	try {
		const client = await clientPromise;
		const db = client.db("reunion_db");

		await db.collection("registrations").updateOne(
			{ _id: new ObjectId(id) },
			{
				$set: {
					isConfirmed: newStatus,
					updatedAt: new Date(),
				},
			},
		);

		return { success: true };
	} catch (error) {
		console.error("❌ Toggle Error:", error);
		return { success: false, error: "আপডেট ব্যর্থ হয়েছে" };
	}
}

// 🔹 Get insights/analytics
export async function getInsights() {
	try {
		const client = await clientPromise;
		const db = client.db("reunion_db");
		const collection = db.collection("registrations");

		// Total counts
		const totalRegistrations = await collection.countDocuments();
		const confirmedCount = await collection.countDocuments({
			isConfirmed: true,
		});
		const pendingCount = totalRegistrations - confirmedCount;

		// Marital status breakdown
		const maritalStats = await collection
			.aggregate([{ $group: { _id: "$maritalStatus", count: { $sum: 1 } } }])
			.toArray();

		// T-shirt size distribution
		const tShirtStats = await collection
			.aggregate([{ $group: { _id: "$tShirtSize", count: { $sum: 1 } } }])
			.toArray();

		// Kids stats
		const withKids = await collection.countDocuments({ hasKids: true });
		const kidsUnder4Total = await collection
			.aggregate([
				{ $match: { hasKids: true } },
				{ $group: { _id: null, total: { $sum: "$kids.under4" } } },
			])
			.toArray();
		const kidsOver4Total = await collection
			.aggregate([
				{ $match: { hasKids: true } },
				{ $group: { _id: null, total: { $sum: "$kids.over4" } } },
			])
			.toArray();

		// Total attendees
		const totalAttendees = await collection
			.aggregate([
				{ $group: { _id: null, total: { $sum: "$totalAttendees" } } },
			])
			.toArray();

		return {
			totalRegistrations,
			confirmedCount,
			pendingCount,
			maritalStats: maritalStats as { _id: string; count: number }[],
			tShirtStats: tShirtStats as { _id: string; count: number }[],
			kids: {
				withKids,
				under4Total: kidsUnder4Total[0]?.total || 0,
				over4Total: kidsOver4Total[0]?.total || 0,
			},
			totalAttendees: totalAttendees[0]?.total || 0,
		};
	} catch (error) {
		console.error("❌ Insights Error:", error);
		return null;
	}
}

// 🔹 Export to CSV
export async function exportToCSV() {
	try {
		const client = await clientPromise;
		const db = client.db("reunion_db");

		const registrations = await db
			.collection("registrations")
			.find({})
			.sort({ registeredAt: -1 })
			.toArray();

		const headers = [
			"Name",
			"Phone",
			"Email",
			"City",
			"Marital Status",
			"T-Shirt Size",
			"Has Kids",
			"Kids Under 4",
			"Kids Over 4",
			"Total Attendees",
			"Confirmed",
			"Registered At",
			"Comment",
		];

		const rows = registrations.map((r: any) => [
			r.name,
			r.phone,
			r.email || "",
			r.currentCity || "",
			r.maritalStatus,
			r.tShirtSize,
			r.hasKids ? "Yes" : "No",
			r.kids?.under4 || 0,
			r.kids?.over4 || 0,
			r.totalAttendees,
			r.isConfirmed ? "Yes" : "No",
			new Date(r.registeredAt).toLocaleString("bn-BD"),
			r.comment || "",
		]);

		const csvContent = [
			headers.join(","),
			...rows.map((row) =>
				row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
			),
		].join("\n");

		return csvContent;
	} catch (error) {
		console.error("❌ CSV Export Error:", error);
		return null;
	}
}

export async function saveRegistration(formData: FormData) {
	try {
		const client = await clientPromise;
		const db = client.db("reunion_db");

		const name = formData.get("name")?.toString().trim();
		const phone = formData.get("phone")?.toString().trim();
		const email = formData.get("email")?.toString().trim() || null;
		const currentCity = formData.get("currentCity")?.toString().trim() || null;
		const maritalStatus = formData.get("maritalStatus")?.toString() as
			| "single"
			| "couple";
		const tShirtSize = formData.get("tShirtSize")?.toString().trim();
		const comment = formData.get("comment")?.toString().trim() || null;
		const hasKids = formData.get("hasKids")?.toString() === "yes";

		const kidsUnder4 = hasKids
			? parseInt(formData.get("kidsUnder4")?.toString() || "0", 10)
			: 0;
		const kidsOver4 = hasKids
			? parseInt(formData.get("kidsOver4")?.toString() || "0", 10)
			: 0;
		const totalAttendees = parseInt(
			formData.get("totalAttendees")?.toString() || "1",
			10,
		);

		// Validation
		if (!name || !phone || !maritalStatus || !tShirtSize) {
			return {
				success: false,
				error: "নাম, ফোন, বৈবাহিক অবস্থা এবং টি-শার্ট সাইজ অবশ্যই দিতে হবে",
			};
		}

		// Deadline check
		const today = new Date();
		const deadline = new Date("2026-05-15T23:59:59");
		if (today > deadline) {
			return {
				success: false,
				error: "রেজিস্ট্রেশন শেষ তারিখ ১৫ মে অতিক্রম হয়েছে",
			};
		}

		await db.collection("registrations").insertOne({
			name,
			phone,
			email,
			currentCity,
			maritalStatus,
			tShirtSize,
			comment,
			hasKids,
			kids: hasKids
				? {
						under4: kidsUnder4,
						over4: kidsOver4,
						total: kidsUnder4 + kidsOver4,
					}
				: null,
			totalAttendees,
			registeredAt: new Date(),
		});

		return { success: true };
	} catch (error) {
		console.error("❌ MongoDB Error:", error);
		return {
			success: false,
			error: "রেজিস্ট্রেশন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।",
		};
	}
}
