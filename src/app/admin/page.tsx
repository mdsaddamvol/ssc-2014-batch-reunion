"use client";

import { useState, useEffect } from "react";
import {
	getRegistrations,
	toggleConfirmation,
	getInsights,
	exportToCSV,
} from "../action";

type Registration = {
	_id: string;
	name: string;
	phone: string;
	email?: string;
	currentCity?: string;
	maritalStatus: "single" | "couple";
	tShirtSize: string;
	comment?: string;
	hasKids: boolean;
	kids?: { under4: number; over4: number; total: number };
	totalAttendees: number;
	isConfirmed: boolean;
	registeredAt: string;
};

type Insights = {
	totalRegistrations: number;
	confirmedCount: number;
	pendingCount: number;
	maritalStats: { _id: string; count: number }[];
	tShirtStats: { _id: string; count: number }[];
	kids: { withKids: number; under4Total: number; over4Total: number };
	totalAttendees: number;
};

export default function AdminPage() {
	const [registrations, setRegistrations] = useState<Registration[]>([]);
	const [insights, setInsights] = useState<Insights | null>(null);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [filterStatus, setFilterStatus] = useState<
		"all" | "confirmed" | "pending"
	>("all");

	// Load data
	const loadData = async () => {
		setLoading(true);
		const [regs, ins] = await Promise.all([
			getRegistrations(searchQuery),
			getInsights(),
		]);

		let filtered = regs as Registration[];
		if (filterStatus === "confirmed") {
			filtered = filtered.filter((r) => r.isConfirmed);
		} else if (filterStatus === "pending") {
			filtered = filtered.filter((r) => !r.isConfirmed);
		}

		setRegistrations(filtered);
		setInsights(ins as Insights);
		setLoading(false);
	};

	useEffect(() => {
		loadData();
	}, []);

	// Toggle confirmation
	const handleToggle = async (id: string, currentStatus: boolean) => {
		const result = await toggleConfirmation(id, !currentStatus);
		if (result.success) {
			loadData(); // Refresh data
		}
	};

	// Export CSV
	const handleExport = async () => {
		const csv = await exportToCSV();
		if (csv) {
			const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `reunion-registrations-${new Date().toISOString().split("T")[0]}.csv`;
			link.click();
			URL.revokeObjectURL(url);
		}
	};

	// Stats Card Component
	const StatCard = ({
		title,
		value,
		icon,
		color,
	}: {
		title: string;
		value: number;
		icon: string;
		color: string;
	}) => (
		<div className={`bg-white rounded-xl p-4 shadow-md border-l-4 ${color}`}>
			<div className='flex items-center justify-between'>
				<div>
					<p className='text-sm text-gray-500'>{title}</p>
					<p className='text-2xl font-bold text-gray-800'>{value}</p>
				</div>
				<span className='text-3xl'>{icon}</span>
			</div>
		</div>
	);

	if (loading) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin text-4xl mb-4'>⏳</div>
					<p className='text-gray-600'>ডাটা লোড হচ্ছে...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<header className='bg-gradient-to-r from-blue-800 to-blue-900 text-white p-6 shadow-lg'>
				<div className='max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4'>
					<div>
						<h1 className='text-2xl font-bold'>🎓 অ্যাডমিন প্যানেল</h1>
						<p className='text-blue-200 text-sm'>এসএসসি ২০১৪ ব্যাচ পুনর্মিলন</p>
					</div>
					<button
						onClick={handleExport}
						className='bg-white text-blue-800 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-2'
					>
						📥 CSV এক্সপোর্ট
					</button>
				</div>
			</header>

			<main className='max-w-7xl mx-auto p-4 md:p-6 space-y-6'>
				{/* 🔍 Search & Filter */}
				<div className='bg-white rounded-xl p-4 shadow-md flex flex-col md:flex-row gap-4'>
					<input
						type='text'
						placeholder='নাম, ফোন বা ইমেইল দিয়ে সার্চ করুন...'
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							loadData();
						}}
						className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
					/>
					<select
						value={filterStatus}
						onChange={(e) => {
							setFilterStatus(
								e.target.value as "all" | "confirmed" | "pending",
							);
							loadData();
						}}
						className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
					>
						<option value='all'>সব রেজিস্ট্রেশন</option>
						<option value='confirmed'>✅ কনফার্মড</option>
						<option value='pending'>⏳ পেন্ডিং</option>
					</select>
				</div>

				{/* 📊 Insights Cards */}
				{insights && (
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						<StatCard
							title='মোট রেজিস্ট্রেশন'
							value={insights.totalRegistrations}
							icon='👥'
							color='border-blue-500'
						/>
						<StatCard
							title='✅ কনফার্মড'
							value={insights.confirmedCount}
							icon='✅'
							color='border-green-500'
						/>
						<StatCard
							title='⏳ পেন্ডিং'
							value={insights.pendingCount}
							icon='⏳'
							color='border-yellow-500'
						/>
						<StatCard
							title='মোট অংশগ্রহণকারী'
							value={insights.totalAttendees}
							icon='🎉'
							color='border-purple-500'
						/>
					</div>
				)}

				{/* 📈 Quick Insights */}
				{insights && (
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						{/* Marital Status */}
						<div className='bg-white rounded-xl p-4 shadow-md'>
							<h3 className='font-semibold text-gray-700 mb-3'>
								💑 বৈবাহিক অবস্থা
							</h3>
							<div className='space-y-2'>
								{insights.maritalStats.map((stat) => (
									<div key={stat._id} className='flex justify-between text-sm'>
										<span className='capitalize'>
											{stat._id === "single" ? "একক" : "দম্পতি"}
										</span>
										<span className='font-semibold'>{stat.count}</span>
									</div>
								))}
							</div>
						</div>

						{/* T-Shirt Sizes */}
						<div className='bg-white rounded-xl p-4 shadow-md'>
							<h3 className='font-semibold text-gray-700 mb-3'>
								👕 টি-শার্ট সাইজ
							</h3>
							<div className='flex flex-wrap gap-2'>
								{insights.tShirtStats.map((stat) => (
									<span
										key={stat._id}
										className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium'
									>
										{stat._id}: {stat.count}
									</span>
								))}
							</div>
						</div>

						{/* Kids Stats */}
						<div className='bg-white rounded-xl p-4 shadow-md'>
							<h3 className='font-semibold text-gray-700 mb-3'>
								👶 সন্তান পরিসংখ্যান
							</h3>
							<div className='space-y-2 text-sm'>
								<div className='flex justify-between'>
									<span>সন্তানসহ পরিবার</span>
									<span className='font-semibold'>
										{insights.kids.withKids}
									</span>
								</div>
								<div className='flex justify-between'>
									<span>৪ বছরের কম</span>
									<span className='font-semibold text-orange-600'>
										{insights.kids.under4Total}
									</span>
								</div>
								<div className='flex justify-between'>
									<span>৪ বছরের বেশি</span>
									<span className='font-semibold text-green-600'>
										{insights.kids.over4Total}
									</span>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* 📋 Registrations Table */}
				<div className='bg-white rounded-xl shadow-md overflow-hidden'>
					<div className='overflow-x-auto'>
						<table className='w-full text-sm'>
							<thead className='bg-gray-100 text-gray-700'>
								<tr>
									<th className='p-4 text-left'>নাম</th>
									<th className='p-4 text-left'>ফোন</th>
									<th className='p-4 text-left'>টি-শার্ট</th>
									<th className='p-4 text-left'>সন্তান</th>
									<th className='p-4 text-left'>মোট</th>
									<th className='p-4 text-center'>স্ট্যাটাস</th>
									<th className='p-4 text-left'>তারিখ</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-100'>
								{registrations.map((reg) => (
									<tr key={reg._id} className='hover:bg-gray-50 transition'>
										<td className='p-4'>
											<div className='font-semibold text-gray-800'>
												{reg.name}
											</div>
											{reg.email && (
												<div className='text-xs text-gray-500'>{reg.email}</div>
											)}
										</td>

										{/* ✅ Callable Phone Number */}
										<td className='p-4'>
											<a
												href={`tel:${reg.phone}`}
												className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-lg font-mono text-sm transition group'
												title='কল করুন'
											>
												<span className='text-gray-400 group-hover:text-blue-600 transition'>
													📞
												</span>
												<span>{reg.phone}</span>
											</a>
										</td>

										<td className='p-4'>
											<span className='px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold'>
												{reg.tShirtSize}
											</span>
										</td>
										<td className='p-4'>
											{reg.hasKids ? (
												<span className='text-orange-600 font-medium'>
													{reg.kids?.total} 👶
												</span>
											) : (
												<span className='text-gray-400'>—</span>
											)}
										</td>
										<td className='p-4 font-bold text-blue-700'>
											{reg.totalAttendees}
										</td>
										<td className='p-4 text-center'>
											<button
												onClick={() => handleToggle(reg._id, reg.isConfirmed)}
												className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
													reg.isConfirmed
														? "bg-green-100 text-green-700 hover:bg-green-200"
														: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
												}`}
											>
												{reg.isConfirmed ? "✅ কনফার্মড" : "⏳ পেন্ডিং"}
											</button>
										</td>
										<td className='p-4 text-gray-500 text-xs'>
											{new Date(reg.registeredAt).toLocaleDateString("bn-BD")}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{registrations.length === 0 && (
						<div className='p-8 text-center text-gray-500'>
							😕 কোনো রেজিস্ট্রেশন পাওয়া যায়নি
						</div>
					)}
				</div>

				{/* Footer Note */}
				<p className='text-center text-gray-400 text-xs pb-6'>
					🔄 পেজ রিফ্রেশ করলে লেটেস্ট ডাটা লোড হবে
				</p>
			</main>
		</div>
	);
}
