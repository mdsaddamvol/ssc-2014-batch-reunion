"use client";

import { useState } from "react";
import { saveRegistration } from "./action";
import Image from "next/image";

export default function ReunionPage() {
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [message, setMessage] = useState("");
    const [fname, setFname] = useState("");
	// State management
	const [maritalStatus, setMaritalStatus] = useState<"single" | "couple">(
		"single",
	);
	const [hasKids, setHasKids] = useState<"yes" | "no">("no");
	const [kidsUnder4, setKidsUnder4] = useState(0);
	const [kidsOver4, setKidsOver4] = useState(0);
	const [tShirtSize, setTShirtSize] = useState(""); // 👕 New state
	const [comment, setComment] = useState(""); // 💬 New state

	// Auto-calculate totals
	const adultsCount = maritalStatus === "couple" ? 2 : 1;
	const kidsTotal = hasKids === "yes" ? kidsUnder4 + kidsOver4 : 0;
	const totalAttendees = adultsCount + kidsTotal;

	async function handleSubmit(formData: FormData) {
		setStatus("loading");
		setFname(formData.get("name"))
		// Append all dynamic values
		formData.set("maritalStatus", maritalStatus);
		formData.set("hasKids", hasKids);
		formData.set("kidsUnder4", hasKids === "yes" ? kidsUnder4.toString() : "0");
		formData.set("kidsOver4", hasKids === "yes" ? kidsOver4.toString() : "0");
		formData.set("totalAttendees", totalAttendees.toString());
		formData.set("tShirtSize", tShirtSize); // 👕 Add T-shirt size
		formData.set("comment", comment); // 💬 Add comment

		const result = await saveRegistration(formData);

		if (result.success) {
			setStatus("success");
			setMessage("আপনার রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে!");
		} else {
			setStatus("error");
			// ✅ ডুপ্লিকেট এরর হাইলাইট
			if (result.error?.includes("ইতিমধ্যে রেজিস্ট্রেশন")) {
				setMessage(
					`⚠️ ${result.error}\n\nঅনুগ্রহ করে ভিন্ন নম্বর বা ইমেইল ব্যবহার করুন।`,
				);
			} else {
				setMessage(result.error || "অজানা ত্রুটি হয়েছে");
			}
		}
	}

	// Reset kids count when "No" is selected
	const handleHasKidsChange = (value: "yes" | "no") => {
		setHasKids(value);
		if (value === "no") {
			setKidsUnder4(0);
			setKidsOver4(0);
		}
	};

	const deadline = "১৫ মে, ২০২৬";

	// T-shirt size options
	const tShirtSizes = ["S", "M", "L", "XL", "XXL", "XXXL"];

	return (
		<div className='min-h-screen bg-gradient-to-b from-blue-50 to-white'>
			{/* 🎨 Hero Banner */}
			<section className='relative w-full'>
				<div className='relative w-full h-auto'>
					<Image
						src='/reunion-banner.jpg'
						alt='প্রথম পুনর্মিলন ২০২৬ - এসএসসি ব্যাচ ২০১৪'
						width={1200}
						height={600}
						className='w-full h-auto object-cover'
						priority
					/>
					<div className='absolute inset-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none'></div>
				</div>
			</section>

			{/* 📝 Registration Form */}
			<section className='relative z-10 max-w-2xl mx-auto px-4 py-12 -mt-8'>
				<div className='bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-yellow-400'>
					{/* Form Header */}
					<div className='bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-center'>
						<h3 className='text-3xl font-bold text-yellow-400 mb-2'>
							রেজিস্ট্রেশন ফর্ম
						</h3>
						<p className='text-blue-200 text-sm'>📅 শেষ তারিখ: {deadline}</p>
					</div>

					{/* Form Body */}
					<form action={handleSubmit} className='p-6 md:p-8 space-y-5'>
						{status === "success" ? (
							<div className='text-center py-12'>
								<div className='text-6xl mb-4'>🎉</div>
								<h4 className='text-2xl font-bold text-green-600 mb-2'>
									অভিনন্দন!
								</h4>
							
								<p className='text-gray-600 text-lg'>{fname}</p>
								<p className='text-gray-600 text-lg'>{message}</p>
							</div>
						) : (
							<>
								{status === "error" && (
									<div className='bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center'>
										❌ {message}
									</div>
								)}

								{/* Name & Phone */}
								<div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
									<div>
										<label className='block text-gray-700 font-semibold mb-2'>
											<span className='mr-2'>👤</span>আপনার নাম{" "}
											<span className='text-red-500'>*</span>
										</label>
										<input
											name='name'
											required
											placeholder='পুরো নাম লিখুন'
											className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition'
										/>
									</div>
									<div>
										<label className='block text-gray-700 font-semibold mb-2'>
											<span className='mr-2'>📱</span>মোবাইল নম্বর{" "}
											<span className='text-red-500'>*</span>
										</label>
										<input
											name='phone'
											required
											type='tel'
											pattern='[0-9]{11}'
											placeholder='01XXXXXXXXX'
											className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition'
										/>
									</div>
								</div>

								{/* Email & City */}
								<div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
									<div>
										<label className='block text-gray-700 font-semibold mb-2'>
											<span className='mr-2'>📧</span>ইমেইল{" "}
											<span className='text-gray-400'>(ঐচ্ছিক)</span>
										</label>
										<input
											name='email'
											type='email'
											placeholder='example@mail.com'
											className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition'
										/>
									</div>
									<div>
										<label className='block text-gray-700 font-semibold mb-2'>
											<span className='mr-2'>🏙️</span>বর্তমান ঠিকানা{" "}
											<span className='text-gray-400'>(ঐচ্ছিক)</span>
										</label>
										<input
											name='currentCity'
											placeholder='যেমন: ঢাকা, চট্টগ্রাম'
											className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition'
										/>
									</div>
								</div>

								{/* 👕 T-Shirt Size Selector */}
								<div className='bg-purple-50 p-4 rounded-xl border-2 border-purple-200'>
									<label className='block text-gray-800 font-bold mb-3'>
										<span className='mr-2'>👕</span>টি-শার্ট সাইজ{" "}
										<span className='text-red-500'>*</span>
									</label>
									<div className='grid grid-cols-3 sm:grid-cols-6 gap-2'>
										{tShirtSizes.map((size) => (
											<label
												key={size}
												className={`flex items-center justify-center cursor-pointer px-3 py-2 rounded-lg border-2 transition font-semibold ${
													tShirtSize === size
														? "bg-purple-600 text-white border-purple-600"
														: "bg-white text-gray-700 border-purple-200 hover:border-purple-400"
												}`}
											>
												<input
													type='radio'
													name='tShirtSize'
													value={size}
													checked={tShirtSize === size}
													onChange={(e) => setTShirtSize(e.target.value)}
													className='sr-only'
												/>
												{size}
											</label>
										))}
									</div>
								</div>

								{/* 👫 Marital Status */}
								<div className='bg-blue-50 p-4 rounded-xl border-2 border-blue-200'>
									<div className='flex flex-wrap gap-4'>
										<label className='flex items-center cursor-pointer bg-white px-4 py-2 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition'>
											<input
												type='radio'
												name='maritalStatus'
												value='single'
												checked={maritalStatus === "single"}
												onChange={(e) =>
													setMaritalStatus(
														e.target.value as "single" | "couple",
													)
												}
												className='h-4 w-4 text-blue-600 focus:ring-blue-500'
											/>
											<span className='ml-2 text-gray-700 font-medium'>
												একক (Single)
											</span>
										</label>
										<label className='flex items-center cursor-pointer bg-white px-4 py-2 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition'>
											<input
												type='radio'
												name='maritalStatus'
												value='couple'
												checked={maritalStatus === "couple"}
												onChange={(e) =>
													setMaritalStatus(
														e.target.value as "single" | "couple",
													)
												}
												className='h-4 w-4 text-blue-600 focus:ring-blue-500'
											/>
											<span className='ml-2 text-gray-700 font-medium'>
												দম্পতি (Couple) 👫
											</span>
										</label>
									</div>
								</div>

								{/* 👶 Has Kids? (Conditional Trigger) */}
								<div className='bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300'>
									<label className='block text-gray-800 font-bold mb-3'>
										<span className='mr-2'>👨‍👩‍👧‍👦</span>আপনি কি সন্তান আনবেন?
									</label>
									<div className='flex flex-wrap gap-4'>
										<label className='flex items-center cursor-pointer bg-white px-4 py-2 rounded-lg border-2 border-yellow-200 hover:border-yellow-400 transition'>
											<input
												type='radio'
												name='hasKids'
												value='no'
												checked={hasKids === "no"}
												onChange={() => handleHasKidsChange("no")}
												className='h-4 w-4 text-yellow-600 focus:ring-yellow-500'
											/>
											<span className='ml-2 text-gray-700 font-medium'>
												না ❌
											</span>
										</label>
										<label className='flex items-center cursor-pointer bg-white px-4 py-2 rounded-lg border-2 border-yellow-200 hover:border-yellow-400 transition'>
											<input
												type='radio'
												name='hasKids'
												value='yes'
												checked={hasKids === "yes"}
												onChange={() => handleHasKidsChange("yes")}
												className='h-4 w-4 text-yellow-600 focus:ring-yellow-500'
											/>
											<span className='ml-2 text-gray-700 font-medium'>
												হ্যাঁ ✅
											</span>
										</label>
									</div>
								</div>

								{/* 👶 Kids Age Split - CONDITIONAL RENDER */}
								{hasKids === "yes" && (
									<div className='bg-gradient-to-r from-yellow-50 to-orange-50 p-5 rounded-xl border-2 border-yellow-400 animate-in fade-in slide-in-from-top-2 duration-300'>
										<label className='block text-gray-800 font-bold text-lg mb-3'>
											<span className='mr-2'>🎂</span>সন্তানদের বয়স বিভাজন
										</label>

										<div className='grid grid-cols-2 gap-4 mb-3'>
											<div>
												<label className='block text-sm text-gray-600 mb-1'>
													৪ বছরের কম 👶
												</label>
												<input
													type='number'
													min='0'
													value={kidsUnder4}
													onChange={(e) =>
														setKidsUnder4(
															Math.max(0, parseInt(e.target.value) || 0),
														)
													}
													className='w-full px-3 py-2 border-2 border-yellow-300 rounded-lg text-center font-bold focus:border-yellow-500 focus:outline-none'
												/>
											</div>
											<div>
												<label className='block text-sm text-gray-600 mb-1'>
													৪ বছরের বেশি 🧒
												</label>
												<input
													type='number'
													min='0'
													value={kidsOver4}
													onChange={(e) =>
														setKidsOver4(
															Math.max(0, parseInt(e.target.value) || 0),
														)
													}
													className='w-full px-3 py-2 border-2 border-yellow-300 rounded-lg text-center font-bold focus:border-yellow-500 focus:outline-none'
												/>
											</div>
										</div>

										<div className='bg-white/60 rounded-lg p-3 text-center border border-yellow-200'>
											<p className='text-sm text-gray-700'>
												<strong>মোট সন্তান:</strong>{" "}
												<span className='text-xl font-bold text-orange-600'>
													{kidsUnder4 + kidsOver4}
												</span>{" "}
												জন
											</p>
										</div>
									</div>
								)}

								{/* 💬 Comment Field */}
								<div>
									<label className='block text-gray-700 font-semibold mb-2'>
										<span className='mr-2'>💬</span>কোনো মন্তব্য বা বিশেষ অনুরোধ{" "}
										<span className='text-gray-400'>(ঐচ্ছিক)</span>
									</label>
									<textarea
										name='comment'
										rows={4}
										placeholder='যেমন: খাবারের এলার্জি, বিশেষ কোনো প্রয়োজন ইত্যাদি...'
										value={comment}
										onChange={(e) => setComment(e.target.value)}
										className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition resize-none'
									/>
									<p className='text-xs text-gray-400 mt-1 text-right'>
										সর্বোচ্চ ৫০০ শব্দ
									</p>
								</div>

								{/* Live Total Preview (Always Visible) */}
								<div className='bg-blue-50 rounded-xl p-4 border-2 border-blue-200'>
									<p className='text-center text-gray-700'>
										<strong>👥 মোট অংশগ্রহণকারী:</strong>{" "}
										<span className='text-2xl font-bold text-blue-700'>
											{totalAttendees}
										</span>{" "}
										জন
									</p>
									<p className='text-xs text-center text-gray-500 mt-1'>
										({adultsCount} প্রাপ্তবয়স্ক{" "}
										{hasKids === "yes" ? `+ ${kidsTotal} সন্তান` : ""})
									</p>
								</div>

								{/* Hidden fields for server */}
								<input
									type='hidden'
									name='maritalStatus'
									value={maritalStatus}
								/>
								<input type='hidden' name='hasKids' value={hasKids} />
								<input
									type='hidden'
									name='kidsUnder4'
									value={hasKids === "yes" ? kidsUnder4 : 0}
								/>
								<input
									type='hidden'
									name='kidsOver4'
									value={hasKids === "yes" ? kidsOver4 : 0}
								/>
								<input type='hidden' name='tShirtSize' value={tShirtSize} />
								<input type='hidden' name='comment' value={comment} />
								<input
									type='hidden'
									name='totalAttendees'
									value={totalAttendees}
								/>

								{/* Submit Button */}
								<button
									type='submit'
									disabled={status === "loading"}
									className='w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white py-4 rounded-xl text-xl font-bold hover:from-blue-800 hover:to-blue-950 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg'
								>
									{status === "loading" ? (
										<span className='flex items-center justify-center gap-2'>
											<span className='animate-spin'>⏳</span>রেজিস্ট্রেশন
											হচ্ছে...
										</span>
									) : (
										"✅ রেজিস্ট্রেশন করুন"
									)}
								</button>

								{/* 📞 Emergency Contacts */}
								<div className='mt-6 pt-4 border-t border-gray-200'>
									<p className='text-center text-gray-700 font-semibold mb-3'>
										📞 জরুরি যোগাযোগ (২৪/৭)
									</p>
									<div className='grid grid-cols-2 gap-3'>
										<a
											href='tel:01755274696'
											className='flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-3 py-2 transition group'
										>
											<span className='text-blue-600 group-hover:scale-110 transition'>
												📱
											</span>
											<div className='text-left'>
												<p className='text-sm font-semibold text-gray-800'>
													কামরুল
												</p>
												<p className='text-xs text-blue-600 font-mono'>
													01755274696
												</p>
											</div>
										</a>
										<a
											href='tel:+8801726855178'
											className='flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-3 py-2 transition group'
										>
											<span className='text-blue-600 group-hover:scale-110 transition'>
												📱
											</span>
											<div className='text-left'>
												<p className='text-sm font-semibold text-gray-800'>
													শামীম
												</p>
												<p className='text-xs text-blue-600 font-mono'>
													01726855178
												</p>
											</div>
										</a>
										<a
											href='tel:+8801919434326'
											className='flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-3 py-2 transition group'
										>
											<span className='text-blue-600 group-hover:scale-110 transition'>
												📱
											</span>
											<div className='text-left'>
												<p className='text-sm font-semibold text-gray-800'>
													আলিফ
												</p>
												<p className='text-xs text-blue-600 font-mono'>
													01919434326
												</p>
											</div>
										</a>
										<a
											href='tel:+8801679344452'
											className='flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-3 py-2 transition group'
										>
											<span className='text-blue-600 group-hover:scale-110 transition'>
												📱
											</span>
											<div className='text-left'>
												<p className='text-sm font-semibold text-gray-800'>
													রবিন
												</p>
												<p className='text-xs text-blue-600 font-mono'>
													01679344452
												</p>
											</div>
										</a>
									</div>
									<p className='text-center text-gray-400 text-xs mt-3'>
										যেকোনো প্রয়োজনে সরাসরি কল করুন
									</p>
								</div>
							</>
						)}
					</form>
				</div>
			</section>

			{/* 📅 Event Details */}
			<section className='max-w-4xl mx-auto px-4 pb-12'>
				<div className='bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-blue-200'>
					<h3 className='text-2xl font-bold text-center text-blue-900 mb-6'>
						📅 অনুষ্ঠানের বিস্তারিত
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='bg-blue-50 rounded-xl p-4 border-l-4 border-blue-600'>
							<div className='flex items-center gap-3 mb-2'>
								<span className='text-2xl'>📅</span>
								<div>
									<p className='text-gray-500 text-sm'>তারিখ</p>
									<p className='text-xl font-bold text-blue-900'>৩০ মে, ২০২৬</p>
								</div>
							</div>
							<div className='flex items-center gap-3'>
								<span className='text-2xl'>🗓️</span>
								<div>
									<p className='text-gray-500 text-sm'>রোজ</p>
									<p className='text-xl font-bold text-blue-900'>শনিবার</p>
								</div>
							</div>
						</div>
						<div className='bg-yellow-50 rounded-xl p-4 border-l-4 border-yellow-500'>
							<div className='flex items-center gap-3 mb-2'>
								<span className='text-2xl'>⏰</span>
								<div>
									<p className='text-gray-500 text-sm'>সময়</p>
									<p className='text-xl font-bold text-yellow-800'>
										সকাল ১০টা থেকে
									</p>
								</div>
							</div>
							<div className='flex items-center gap-3'>
								<span className='text-2xl'>📍</span>
								<div>
									<p className='text-gray-500 text-sm'>স্থান</p>
									<p className='text-xl font-bold text-yellow-800'>
										বিদ্যালয় প্রাঙ্গণ
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className='mt-6 text-center'>
						<p className='text-lg italic text-gray-600 bg-gray-50 p-4 rounded-lg'>
							&quot;স্মৃতির আঙিনায় ফিরি মোরা, বন্ধুত্বের টানে বারে
							বারে...&quot;
						</p>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='bg-gradient-to-r from-blue-900 to-blue-700 text-white text-center py-6 px-4'>
				<p className='text-yellow-400 font-semibold text-lg'>
					আয়োজনে: এসএসসি ২০১৪ ব্যাচ পরিবার
				</p>
				<p className='text-blue-200 text-sm mt-2'>
					© ২০২৬ এম.কে.ডি.আর. গণ উচ্চ বিদ্যালয় পুনর্মিলনী
				</p>
			</footer>
		</div>
	);
}
