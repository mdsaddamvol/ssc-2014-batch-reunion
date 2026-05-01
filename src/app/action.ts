"use server";

import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI environment variable is missing");

// 🔹 Type Definitions
export type Registration = {
	_id: string;
	name: string;
	phone: string;
	email: string | null;
	currentCity: string | null;
	maritalStatus: "single" | "couple";
	tShirtSize: "S" | "M" | "L" | "XL" | "XXL" | "XXXL";
	comment: string | null;
	hasKids: boolean;
	kids: {
		under4: number;
		over4: number;
		total: number;
	} | null;
	totalAttendees: number;
	isConfirmed: boolean;
	registeredAt: string | Date;
	updatedAt?: string | Date;
};

export type Insights = {
	totalRegistrations: number;
	confirmedCount: number;
	pendingCount: number;
	maritalStats: { _id: string; count: number }[];
	tShirtStats: { _id: string; count: number }[];
	kids: {
		withKids: number;
		under4Total: number;
		over4Total: number;
	};
	totalAttendees: number;
};

export type SaveRegistrationResult = {
	success: boolean;
	error?: string;
};

export type ToggleResult = {
	success: boolean;
	error?: string;
};

// 🔹 Singleton MongoDB Connection
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
export async function getRegistrations(
	searchQuery?: string,
): Promise<Registration[]> {
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

		// Convert ObjectId to string & Date to ISO string for serialization
		return registrations.map((reg) => ({
			...reg,
			_id: reg._id.toString(),
			registeredAt:
				reg.registeredAt instanceof Date
					? reg.registeredAt.toISOString()
					: reg.registeredAt,
			updatedAt:
				reg.updatedAt instanceof Date
					? reg.updatedAt.toISOString()
					: reg.updatedAt,
		})) as Registration[];
	} catch (error) {
		console.error("❌ Fetch Error:", error);
		return [];
	}
}

// 🔹 Toggle confirmation status
export async function toggleConfirmation(
	id: string,
	newStatus: boolean,
): Promise<ToggleResult> {
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
export async function getInsights(): Promise<Insights | null> {
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
			.aggregate<{
				_id: string;
				count: number;
			}>([{ $group: { _id: "$maritalStatus", count: { $sum: 1 } } }])
			.toArray();

		// T-shirt size distribution
		const tShirtStats = await collection
			.aggregate<{
				_id: string;
				count: number;
			}>([{ $group: { _id: "$tShirtSize", count: { $sum: 1 } } }])
			.toArray();

		// Kids stats
		const withKids = await collection.countDocuments({ hasKids: true });

		const kidsUnder4Agg = await collection
			.aggregate<{
				total: number;
			}>([
				{ $match: { hasKids: true } },
				{ $group: { _id: null, total: { $sum: "$kids.under4" } } },
			])
			.toArray();

		const kidsOver4Agg = await collection
			.aggregate<{
				total: number;
			}>([
				{ $match: { hasKids: true } },
				{ $group: { _id: null, total: { $sum: "$kids.over4" } } },
			])
			.toArray();

		// Total attendees
		const totalAttendeesAgg = await collection
			.aggregate<{
				total: number;
			}>([{ $group: { _id: null, total: { $sum: "$totalAttendees" } } }])
			.toArray();

		return {
			totalRegistrations,
			confirmedCount,
			pendingCount,
			maritalStats: maritalStats.map((s) => ({
				_id: s._id || "unknown",
				count: s.count,
			})),
			tShirtStats: tShirtStats.map((s) => ({
				_id: s._id || "unknown",
				count: s.count,
			})),
			kids: {
				withKids,
				under4Total: kidsUnder4Agg[0]?.total || 0,
				over4Total: kidsOver4Agg[0]?.total || 0,
			},
			totalAttendees: totalAttendeesAgg[0]?.total || 0,
		};
	} catch (error) {
		console.error("❌ Insights Error:", error);
		return null;
	}
}

// 🔹 Export to CSV (Type-safe version)
export async function exportToCSV(): Promise<string | null> {
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

		// ✅ Type-safe mapping with proper null checks
		const rows = registrations.map(
			(doc: {
				_id: ObjectId;
				name?: string;
				phone?: string;
				email?: string | null;
				currentCity?: string | null;
				maritalStatus?: "single" | "couple";
				tShirtSize?: string;
				hasKids?: boolean;
				kids?: { under4?: number; over4?: number } | null;
				totalAttendees?: number;
				isConfirmed?: boolean;
				registeredAt?: Date | string;
				comment?: string | null;
			}) => {
				const safeDate =
					doc.registeredAt instanceof Date
						? doc.registeredAt
						: new Date(doc.registeredAt || Date.now());

				return [
					doc.name || "",
					doc.phone || "",
					doc.email || "",
					doc.currentCity || "",
					doc.maritalStatus || "",
					doc.tShirtSize || "",
					doc.hasKids ? "Yes" : "No",
					doc.kids?.under4 ?? 0,
					doc.kids?.over4 ?? 0,
					doc.totalAttendees ?? 0,
					doc.isConfirmed ? "Yes" : "No",
					safeDate.toLocaleString("bn-BD"),
					doc.comment || "",
				] as const;
			},
		);

		const csvContent = [
			headers.join(","),
			...rows.map((row) =>
				Array.from(row)
					.map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
					.join(","),
			),
		].join("\n");

		return csvContent;
	} catch (error) {
		console.error("❌ CSV Export Error:", error);
		return null;
	}
}

// 🔹 Save new registration (With duplicate prevention)
export async function saveRegistration(
	formData: FormData,
): Promise<SaveRegistrationResult> {
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
		const tShirtSize = formData
			.get("tShirtSize")
			?.toString()
			.trim() as Registration["tShirtSize"];
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

		// 🔹 Basic Validation
		if (!name || !phone || !maritalStatus || !tShirtSize) {
			return {
				success: false,
				error: "নাম, ফোন, বৈবাহিক অবস্থা এবং টি-শার্ট সাইজ অবশ্যই দিতে হবে",
			};
		}

		// 🔹 Phone format validation (Bangladesh)
		const phoneRegex = /^01[3-9]\d{8}$/;
		if (!phoneRegex.test(phone)) {
			return {
				success: false,
				error: "সঠিক মোবাইল নম্বর দিন (যেমন: 01712345678)",
			};
		}

		// 🔹 Email format validation (if provided)
		if (email) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				return { success: false, error: "সঠিক ইমেইল এড্রেস দিন" };
			}
		}

		// 🔹 Deadline check
		const today = new Date();
		const deadline = new Date("2026-05-15T23:59:59");
		if (today > deadline) {
			return {
				success: false,
				error: "রেজিস্ট্রেশন শেষ তারিখ ১৫ মে অতিক্রম হয়েছে",
			};
		}

		// 🔹 ✅ DUPLICATE CHECK: Phone or Email already exists?
		const existing = await db.collection("registrations").findOne({
			$or: [
				{ phone: phone },
				...(email ? [{ email: email }] : []), // Only check email if provided
			],
		});

		if (existing) {
			// Determine which field caused the duplicate
			if (existing.phone === phone) {
				return {
					success: false,
					error: "এই ফোন নম্বর দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে",
				};
			}
			if (email && existing.email === email) {
				return {
					success: false,
					error: "এই ইমেইল দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে",
				};
			}
			return {
				success: false,
				error: "এই তথ্য দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে",
			};
		}

		// 🔹 Insert to DB
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
			isConfirmed: false, // Default status
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
