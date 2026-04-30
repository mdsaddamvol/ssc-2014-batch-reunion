"use client";

import { useState } from "react";
import { saveRegistration } from "./action";
import Image from "next/image";

export default function ReunionPage() {
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [message, setMessage] = useState("");

	async function handleSubmit(formData: FormData) {
		setStatus("loading");
		const result = await saveRegistration(formData);

		if (result.success) {
			setStatus("success");
			setMessage("আপনার রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে!");
		} else {
			setStatus("error");
			setMessage(result.error || "অজানা ত্রুটি হয়েছে");
		}
	}

	return (
		<div className='min-h-screen bg-gradient-to-b from-blue-50 to-white'>
			{/* 🎨 Hero Banner Section */}
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
					{/* Overlay for better text readability if needed */}
					<div className='absolute inset-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none'></div>
				</div>
			</section>

			{/* 📝 Registration Form Section */}
			<section className='relative z-10 max-w-2xl mx-auto px-4 py-12 -mt-8'>
				<div className='bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-yellow-400'>
					{/* Form Header */}
					<div className='bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-center'>
						<h3 className='text-3xl font-bold text-yellow-400 mb-2'>
							রেজিস্ট্রেশন ফর্ম
						</h3>
						<p className='text-blue-200'>
							নিচের ফর্মটি পূরণ করে পুনর্মিলনে অংশগ্রহণ করুন
						</p>
					</div>

					{/* Form Body */}
					<form action={handleSubmit} className='p-6 md:p-8 space-y-5'>
						{status === "success" ? (
							<div className='text-center py-12'>
								<div className='text-6xl mb-4'>🎉</div>
								<h4 className='text-2xl font-bold text-green-600 mb-2'>
									অভিনন্দন!
								</h4>
								<p className='text-gray-600 text-lg'>{message}</p>
								<p className='text-sm text-gray-500 mt-4'>
									আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব
								</p>
								<button
									type='button'
									onClick={() => window.location.reload()}
									className='mt-6 px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-semibold'
								>
									আরেকটি রেজিস্ট্রেশন
								</button>
							</div>
						) : (
							<>
								{status === "error" && (
									<div className='bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center'>
										❌ {message}
									</div>
								)}

								<div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
									{/* Name */}
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

									{/* Phone */}
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

								<div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
									{/* Email */}
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

									{/* Current City */}
									<div>
										<label className='block text-gray-700 font-semibold mb-2'>
											<span className='mr-2'>🏙️</span>বর্তমান শহর{" "}
											<span className='text-gray-400'>(ঐচ্ছিক)</span>
										</label>
										<input
											name='currentCity'
											placeholder='যেমন: ঢাকা, চট্টগ্রাম'
											className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition'
										/>
									</div>
								</div>

								{/* Attendees Count - IMPORTANT FIELD */}
								<div className='bg-gradient-to-r from-yellow-50 to-orange-50 p-5 rounded-xl border-2 border-yellow-400'>
									<label className='block text-gray-800 font-bold text-lg mb-3'>
										<span className='mr-2'>👥</span>কতজন আসতে চান?{" "}
										<span className='text-red-500'>*</span>
									</label>
									<div className='flex items-center gap-4'>
										<input
											name='attendees'
											required
											type='number'
											min='1'
											max='15'
											defaultValue='1'
											className='w-32 px-4 py-3 border-2 border-yellow-400 rounded-xl text-center text-xl font-bold focus:border-yellow-600 focus:outline-none transition'
										/>
										<p className='text-sm text-gray-600'>
											পরিবারের সদস্যসহ মোট সংখ্যা লিখুন (সর্বোচ্চ ১৫ জন)
										</p>
									</div>
								</div>

								{/* Submit Button */}
								<button
									type='submit'
									disabled={status === "loading"}
									className='w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white py-4 rounded-xl text-xl font-bold hover:from-blue-800 hover:to-blue-950 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg'
								>
									{status === "loading" ? (
										<span className='flex items-center justify-center gap-2'>
											<span className='animate-spin'>⏳</span>
											রেজিস্ট্রেশন হচ্ছে...
										</span>
									) : (
										"✅ রেজিস্ট্রেশন করুন"
									)}
								</button>

								<p className='text-center text-gray-500 text-sm'>
									📞 জরুরি যোগাযোগ: এসএসসি ২০১৪ ব্যাচ পরিবার
								</p>
							</>
						)}
					</form>
				</div>
			</section>

			{/* 📅 Event Details Section */}
			<section className='max-w-4xl mx-auto px-4 pb-12'>
				<div className='bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-blue-200'>
					<h3 className='text-2xl font-bold text-center text-blue-900 mb-6'>
						📅 অনুষ্ঠানের বিস্তারিত
					</h3>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{/* Date & Day */}
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

						{/* Time & Venue */}
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

					{/* Quote */}
					<div className='mt-6 text-center'>
						<p className='text-lg italic text-gray-600 bg-gray-50 p-4 rounded-lg'>
							"স্মৃতির আঙিনায় ফিরি মোরা, বন্ধুত্বের টানে বারে বারে..."
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
