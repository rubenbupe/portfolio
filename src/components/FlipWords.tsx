'use client';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { cn } from '../lib/utils';

export const FlipWords = ({
	words,
	duration = 3000,
	className,
	letterClassName
}: {
	words: string[];
	duration?: number;
	className?: string;
	letterClassName?: string;
}) => {
	const [currentWord, setCurrentWord] = useState(words[0]);
	const [isAnimating, setIsAnimating] = useState<boolean>(false);

	const startAnimation = useCallback(() => {
		const word = words[words.indexOf(currentWord) + 1] || words[0];
		setCurrentWord(word);
		setIsAnimating(true);
	}, [currentWord, words]);

	useEffect(() => {
		if (!isAnimating)
			setTimeout(() => {
				startAnimation();
			}, duration);
	}, [isAnimating, duration, startAnimation]);

	return (
		<MotionConfig reducedMotion="user">
			<AnimatePresence
				onExitComplete={() => {
					setIsAnimating(false);
				}}
			>
				<motion.div
					initial={{
						opacity: 0,
						y: 10
					}}
					animate={{
						opacity: 1,
						y: 0
					}}
					transition={{
						type: 'spring',
						stiffness: 100,
						damping: 10
					}}
					exit={{
						opacity: 0,
						y: -10,
						x: 10,
						filter: 'blur(8px)',
						scale: 1.25,
						position: 'absolute'
					}}
					className={cn('inline-block relative text-left px-2', className)}
					key={currentWord}
				>
					{currentWord.split('').map((letter, index) => (
						<motion.span
							key={currentWord + index}
							initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
							animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
							transition={{
								delay: index * 0.08,
								duration: 0.4
							}}
							className={cn('inline whitespace-nowrap', letterClassName)}
						>
							{`${letter}`}
						</motion.span>
					))}
				</motion.div>
			</AnimatePresence>
		</MotionConfig>
	);
};
