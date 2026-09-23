import React, { useEffect, useId, useState } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'framer-motion';
import { HoloCard } from './HoloCard';
import { jobs, type Job } from '../constants/jobs';
import { cn } from '../lib/utils';
import holocardLogoPatternSvg from '../assets/svg/holocard-logo-pattern.svg?raw';

// Accordion of jobs. When an item opens, its logo morphs into the holographic
// card of the company (shared layoutId), next to the details.
export function ExpandableHoloJobCards({
	bullet,
	listClassName,
	defaultOpenId = jobs[0]?.id ?? null
}: {
	bullet?: React.ReactNode;
	listClassName?: string;
	defaultOpenId?: number | null;
}) {
	const [activeId, setActiveId] = useState<number | null>(defaultOpenId);
	const id = useId();

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setActiveId(null);
			}
		}

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	// The timeline asks to open a job by dispatching `job:open` with its id
	const [scrollTargetId, setScrollTargetId] = useState<number | null>(null);

	useEffect(() => {
		function onOpenJob(event: Event) {
			const jobId = (event as CustomEvent<number>).detail;
			setActiveId(jobId);
			setScrollTargetId(jobId);
		}

		window.addEventListener('job:open', onOpenJob);
		return () => window.removeEventListener('job:open', onOpenJob);
	}, []);

	// Scroll once the new layout is committed. offsetTop ignores the transforms of the
	// running layout animation, so we land on the final position of the row.
	useEffect(() => {
		if (scrollTargetId === null) return;
		const row = document.querySelector<HTMLElement>(`[data-job="${scrollTargetId}"]`);
		setScrollTargetId(null);
		if (!row) return;

		let top = 0;
		for (let element: HTMLElement | null = row; element; element = element.offsetParent as HTMLElement | null) {
			top += element.offsetTop;
		}

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: top - 112, behavior: reduceMotion ? 'auto' : 'smooth' });
	}, [scrollTargetId]);

	return (
		<MotionConfig reducedMotion="user">
			<LayoutGroup id={id}>
				<ul className={cn('flex flex-col border-t', listClassName)}>
					{jobs.map(job => {
						const isOpen = activeId === job.id;
						return (
							<motion.li
								key={job.id}
								layout="position"
								data-job={job.id}
								className="group relative flex flex-col border-b"
							>
								<button
									className="grid w-full grid-cols-[44px_1fr_auto] md:grid-cols-[52px_1fr_auto_28px] items-center gap-4 md:gap-5 py-6 px-1 text-left cursor-pointer"
									aria-expanded={isOpen}
									aria-controls={`job-panel-${job.id}-${id}`}
									onClick={() => setActiveId(isOpen ? null : job.id)}
								>
									<span
										className={cn(
											'relative size-11 md:size-13 rounded-2xl corner-superellipse-[1.4] border border-dashed transition-colors duration-300',
											// Dashed slot left behind while the logo lives in the chrome card
											isOpen ? 'border-foreground/30' : 'border-transparent'
										)}
									>
										{!isOpen && (
											<motion.span
												layoutId={`logo-${job.id}`}
												transition={morphTransition}
												className="absolute inset-0 grid place-items-center rounded-2xl corner-superellipse-[1.4] border border-foreground/30 outline-solid outline-[1px] outline-background bg-[hsl(0_0%3.9%)] transition-[rotate,scale] duration-500 group-hover:-rotate-6 group-hover:scale-105"
											>
												<span className="w-6 md:w-7" dangerouslySetInnerHTML={{ __html: job.svg }} />
											</motion.span>
										)}
									</span>
									<span className="flex flex-col min-w-0">
										<span className="font-display text-2xl md:text-3xl tracking-tight leading-tight">{job.title}</span>
										<span className="text-sm md:text-base text-foreground/60">{job.role}</span>
									</span>
									<code className="text-xs text-foreground/60 px-2.5 py-1.5 rounded-full border whitespace-nowrap max-md:hidden">
										{job.timePeriod}
									</code>
									<span
										className={cn(
											'relative size-7 rounded-full border transition-all duration-500 max-md:hidden',
											"before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:w-2.5 before:h-px before:bg-foreground before:-translate-x-1/2 before:-translate-y-1/2",
											"after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:w-2.5 after:h-px after:bg-foreground after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-90 after:transition-transform after:duration-500",
											isOpen && 'rotate-180 bg-foreground/10 after:rotate-0'
										)}
										aria-hidden="true"
									/>
								</button>

								<AnimatePresence initial={false} mode="popLayout">
									{isOpen && (
										<motion.div
											key="panel"
											id={`job-panel-${job.id}-${id}`}
											layout="position"
											exit={{ opacity: 0, transition: { duration: 0.12 } }}
										>
											<JobDetails job={job} bullet={bullet} />
										</motion.div>
									)}
								</AnimatePresence>
							</motion.li>
						);
					})}
				</ul>
			</LayoutGroup>
		</MotionConfig>
	);
}

const morphTransition = { type: 'spring', stiffness: 170, damping: 24 } as const;

const JobDetails = ({ job, bullet }: { job: Job; bullet?: React.ReactNode }) => {
	return (
		<div className="grid md:grid-cols-[320px_1fr] gap-8 md:gap-12 items-start px-1 pb-10">
			<motion.div
				layoutId={`logo-${job.id}`}
				transition={morphTransition}
				className="justify-self-center md:justify-self-start rounded-[48px]"
			>
				<HoloCard
					className="flex flex-col items-center justify-center"
					foilSvg={job.svg}
					logoPatternSvg={holocardLogoPatternSvg}
				>
					<div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: job.svg }} />
					<p className="text-white font-bold text-xl mt-4">{job.title}</p>
					<p className="absolute bottom-4 text-white/50 text-xs">{job.timePeriod}</p>
				</HoloCard>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.15, duration: 0.4 }}
				className="flex flex-col gap-5 min-w-0"
			>
				<ul className="flex flex-col gap-3 text-foreground/60 text-sm md:text-base">
					{job.paragraphs.map((paragraph, index) => (
						<li className="flex items-start gap-2" key={index}>
							{bullet}
							<span className="flex-1">{paragraph}</span>
						</li>
					))}
				</ul>
				<div className="flex gap-1.5 flex-wrap">
					{job.badges.map(badge => (
						<code
							key={badge}
							className="text-[11.5px] leading-none px-2 py-1.5 rounded-lg border border-foreground/12 bg-foreground/4 text-foreground/85"
						>
							{badge}
						</code>
					))}
				</div>
			</motion.div>
		</div>
	);
};
