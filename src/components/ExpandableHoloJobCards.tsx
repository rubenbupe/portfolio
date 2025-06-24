
import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "../lib/hooks";
import { HoloCard } from "./HoloCard";
import measesoranSvg from "../assets/svg/measesoran.svg?raw";
import gabinsoftSvg from "../assets/svg/gabinsoft.svg?raw";
import calmavitySvg from "../assets/svg/calmavity.svg?raw";
import nodelixSvg from "../assets/svg/nodelix.svg?raw";
import holocardLogoPatternSvg from "../assets/svg/holocard-logo-pattern.svg?raw";

export function ExpandableHoloJobCards({
	animation,
	bullet,
	listClassName,
}: {
	animation?: React.ReactNode;
	bullet?: React.ReactNode;
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
            className="fixed inset-0 bg-card/20 h-full w-full z-[1] backdrop-blur-md"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="fixed inset-0  grid place-items-center z-[1]">
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className="relative w-full max-w-[500px] flex flex-col  h-full md:h-fit md:max-h-[90%]  flex flex-col bg-card/90 sm:rounded-[48px] overflow-hidden sm:border sm:outline outline-[1px] outline-black"
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
								className="flex absolute top-6 left-6 items-center justify-center bg-card rounded-full h-6 w-6 outline outline-[1px] outline-black border"
								onClick={() => setActive(null)}
							>
								<CloseIcon />
							</motion.button>
             
							<div className="w-full max-h-64 p-12 flex items-center justify-center" >
								<motion.div layoutId={`image-${active.id}-${id}`} className="w-24" dangerouslySetInnerHTML={{ __html: active.svg }} />
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
											layoutId={`role-${active.id}-${id}`}
											className="text-primary/50 text-base"
										>
											{active.role}
										</motion.p>
                    <motion.p
                      layoutId={`timeperiod-${active.id}-${id}`}
                      className="text-primary/50 text-base text-xs"
                    >
                      {active.timePeriod}
                    </motion.p>
                  </div>
                </div>
								<div className="p-4 px-6">
									<motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1 gap-y-2 flex-wrap">
										{active.badges.map((badge, index) => (
											<span key={index} className="text-xs bg-foreground text-background px-2 py-1 rounded-full mr-2">{badge}</span>
										))}
									</motion.div>
								</div>
                <div className="pt-4 relative px-6 flex-1">
                  <motion.ul
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 text-foreground/60 text-xs md:text-sm h-40 md:h-fit pb-10 flex flex-col items-start gap-4"
                  >
                    {active.paragraphs.map((paragraph, index) => (
											<div className="flex items-start gap-2" key={index}>
												{bullet}
												<li className="flex-1">{paragraph}</li>
											</div>
										))}
                  </motion.ul>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
			<ul className={listClassName}>
        {cards.map((card) => (
					<motion.li
						layoutId={`card-${card.id}-${id}`}
						key={card.title}
						className="flex flex-col items-center cursor-pointer"
					>
						<button
							className="rounded-[48px]"
							aria-label={`View ${card.title} details`}
							onClick={() => setActive(card)}
						>
							<HoloCard
									className="flex flex-col items-center justify-center"
									foilSvg={card.svg}
									logoPatternSvg={holocardLogoPatternSvg}
							>
								<motion.div layoutId={`image-${card.id}-${id}`} className="w-12 h-12">
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
						</button>
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

// ...existing code...
const cards = [
  {
    id: 1,
    title: "Gabinsoft",
    timePeriod: "2022 - present",
    svg: gabinsoftSvg,
    badges: ["TypeScript", "Go", "React", "React Native", "HTML/CSS", "Docker", "Kubernetes", "SQL", "RabbitMQ", "Redis", "NodeJS", "Google Cloud", "Git"],
    role: "Co-Founder & Fullstack Developer",
    paragraphs: [
      "Led the creation of the platform, building the backend, frontend, and mobile apps from the ground up.",
      "Designed and implemented the psychologist platform based on business requirements, developing new features and improving existing ones.",
      "Developed the marketing website with a focus on design, SEO, and performance.",
      "Migrated critical and resource-intensive processes to independent Go services, enabling platform scalability and reducing bottlenecks.",
    ],
  },
  {
    id: 2,
    title: "Me Asesoran",
    timePeriod: "Sep. 2020 - present",
    svg: measesoranSvg,
    badges: ["PHP", "Laravel", "React", "TypeScript", "HTML/CSS", "Docker", "Kubernetes", "PostgreSQL", "RabbitMQ", "NodeJS", "AWS", "Git"],
    role: "Fullstack Developer",
    paragraphs: [
      "Developed key features for the main platform, working on both backend and frontend for thousands of users.",
      "Collaborated with the product team to understand user needs and deliver features that matched expectations.",
      "Led the migration from a monolithic to a microservices architecture, implementing event-driven design, CQRS, and DDD to improve scalability and development speed.",
      "Spearheaded the development of Me Asesoran Rentas, integrating with Spain's government APIs and authentication for seamless tax return submissions.",
    ],
  },
  {
    id: 3,
    title: "Calmavity",
    timePeriod: "2019 - 2022",
    svg: calmavitySvg,
    badges: ["TypeScript", "React", "React Native", "HTML/CSS", "Docker", "Kubernetes", "MongoDB", "NodeJS", "AWS", "Git"],
    role: "Co-Founder & Fullstack Developer",
    paragraphs: [
      "Led full-stack development, including architecture, design, and implementation of backend and frontend technologies.",
      "Built a cross-platform mobile app with features like authentication, push notifications, real-time chat, and video calls.",
      "Developed a web application mirroring mobile features using React.",
      "Created a NodeJS and MongoDB backend serving web, mobile, and internal analytics tools, enabling rapid iteration.",
      "Deployed on GCP with Docker and Kubernetes for scalable, reliable infrastructure, using the project as a learning opportunity for new technologies.",
    ],
  },
  {
    id: 4,
    title: "Nodelix",
    timePeriod: "2019 - present",
    svg: nodelixSvg,
    badges: ["Python", "Django", "ML", "TensorFlow", "OCR", "AWS", "Git"],
    role: "Co-Founder & Fullstack Developer",
    paragraphs: [
      "Delivered scalable ML solutions for fiscal sector clients, focusing on OCR and data extraction tools.",
      "Developed a custom OCR pipeline for real-time data processing and extraction from various documents, including invoices and contracts.",
      "Worked closely with clients to understand requirements and deliver tailored solutions.",
      "Designed a dynamically scalable system to optimize costs and handle peak demand periods efficiently.",
    ],
  },
]

