
import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "../lib/hooks";
import { HoloCard } from "./HoloCard";

export function ExpandableHoloJobCard({
	animation,
	listClassName,
}: {
	animation?: React.ReactNode;
	listClassName?: string;
}) {
  const [active, setActive] = useState<(typeof cards)[number] | boolean | null>(
    null
  );
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-card/20 h-full w-full z-10 backdrop-blur-md"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="fixed inset-0  grid place-items-center z-[100]">
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className="relative w-full max-w-[500px] flex flex-col  h-full md:h-fit md:max-h-[90%]  flex flex-col bg-card/90 sm:rounded-[48px] overflow-hidden sm:border sm:outline outline-[1px] outline-card"
            >
							{animation}
							<motion.button
								key={`button-${active.id}-${id}`}
								layout
								initial={{
									opacity: 0,
								}}
								animate={{
									opacity: 1,
								}}
								exit={{
									opacity: 0,
									transition: {
										duration: 0.05,
									},
								}}
								className="flex absolute top-6 left-6 items-center justify-center bg-card rounded-full h-6 w-6 outline outline-[1px] outline-card border"
								onClick={() => setActive(null)}
							>
								<CloseIcon />
							</motion.button>
             
							<div className="w-full min-h-64 flex items-center justify-center" >
								<motion.div layoutId={`image-${active.id}-${id}`} dangerouslySetInnerHTML={{ __html: active.svg }} />
							</div>

              <div className="flex-1 flex flex-col overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]">
                <div className="flex justify-between items-start p-4 px-6">
                  <div className="">
                    <motion.h3
                      layoutId={`title-${active.id}-${id}`}
                      className="font-medium text-lg"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`timeperiod-${active.id}-${id}`}
                      className="text-neutral-600 dark:text-neutral-400 text-base"
                    >
                      {active.timePeriod}
                    </motion.p>
                  </div>
                </div>
								<div className="p-4 px-6">
									<motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1">
										{active.badges.map((badge, index) => (
											<span key={index} className="text-xs bg-foreground text-background px-2 py-1 rounded-full mr-2">{badge}</span>
										))}
									</motion.div>
								</div>
                <div className="pt-4 relative px-6 flex-1">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 text-foreground/50 text-xs md:text-sm lg:text-base h-40 md:h-fit pb-10 flex flex-col items-start gap-4"
                  >
                    {active.paragraphs.map((paragraph, index) => (
											<p key={index}>{paragraph}</p>
										))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
			<ul className={listClassName}>
        {cards.map((card, index) => (
					<motion.li
						layoutId={`card-${card.id}-${id}`}
						key={card.title}
						onClick={() => setActive(card)}
						className="flex flex-col items-center cursor-pointer"
					>
						<HoloCard
								className="flex flex-col items-center justify-center"
								foilSvg={card.svg}
						>
							<motion.div layoutId={`image-${card.id}-${id}`}>
								<div dangerouslySetInnerHTML={{ __html: card.svg }} />
              </motion.div>
							<motion.p 
							layoutId={`title-${card.id}-${id}`}
							className="text-white font-bold text-xl mt-4">{card.title}</motion.p>
							<motion.p className="absolute bottom-4 text-foreground/50 text-xs" layoutId={`timeperiod-${card.id}-${id}`}>
								{card.timePeriod}
							</motion.p>
							<p className="visually-hidden" aria-hidden="true">{card.paragraphs.reduce((acc, a) => `${acc} ${a}`, '')}</p>
						</HoloCard>
					</motion.li>
          
        ))}
			</ul>
    </>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};

const cards = [
  {
		id: 1,
		title: "Job",
		timePeriod: "2020 - present",
		svg: `<svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="66"
      height="66"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>`,
		badges: ["React", "TypeScript", "Tailwind CSS"],
		role: "Frontend Developer",
		paragraphs: [
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
		],
  },
  {
		id: 2,
		title: "Job 2",
		timePeriod: "2023 - present",
		svg: `<svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="66"
      height="66"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>`,
		badges: ["React", "TypeScript", "Tailwind CSS"],
		role: "Frontend Developer",
		paragraphs: [
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
		],
  },
  {
		id: 3,
		title: "Job 3",
		timePeriod: "2023 - present",
		svg: `<svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="66"
      height="66"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>`,
		badges: ["React", "TypeScript", "Tailwind CSS"],
		role: "Frontend Developer",
		paragraphs: [
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
		],
  },
	{
		id: 4,
		title: "Job 4",
		timePeriod: "2023 - present",
		svg: `<svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="66"
      height="66"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>`,
		badges: ["React", "TypeScript", "Tailwind CSS"],
		role: "Frontend Developer",
		paragraphs: [
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut purus eget nunc. Nullam nec nisl nec nunc.",
		],
  },
]
