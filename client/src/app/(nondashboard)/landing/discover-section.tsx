"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const DiscoverSection = () => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.8 }}
      variants={containerVariants}
      className="py-12 px-6 bg-white mb-16"
    >
      <div className="max-w-4xl xl:max-w-7xl mx-auto px-6 sm:px-12 xl:px-16 text-center">
        <motion.div variants={itemVariants} className="my-12 text-center">
          <h2 className="text-3xl font-semibold leading-tight text-gray-800">
            Discover
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Find your Dream Rental Property Today!
          </p>
          <p className="mt-2 text-gray-500 max-w-3xl mx-auto">
            Searching for the perfect rental property has never been easier.
            With our user-friendly platform, you can explore a wide range of
            rental listings, filter by your preferences, and connect with
            landlords directly. Start your journey to finding the ideal home
            today!
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 xl:gap-16">
          {[
            {
              imgSrc: "/landing-icon-wand.png",
              title: "Search for Properties",
              description:
                "Easily search for rental properties based on your criteria.",
            },
            {
              imgSrc: "/landing-icon-calendar.png",
              title: "Book your Rental",
              description:
                "Once you find a property you like, book a viewing or apply online.",
            },
            {
              imgSrc: "/landing-icon-heart.png",
              title: "Enjoy your New Home",
              description:
                "Move into your new rental property and enjoy your new home!",
            },
          ].map((card, index) => (
            <motion.div key={index} variants={itemVariants}>
              <DiscoverCard {...card} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const DiscoverCard = ({
  imgSrc,
  title,
  description,
}: {
  imgSrc: string;
  title: string;
  description: string;
}) => {
  return (
    <div className="px-4 py-12 shadow-lg rounded-lg bg-primary-50 md:h-72">
      <div className="bg-primary-700 p-[0.6rem] rounded-full mb-4 h-10 w-10 mx-auto">
        <Image
          src={imgSrc}
          alt={title}
          width={30}
          height={30}
          className="w-full h-full"
        />
      </div>
      <h3 className="mt-4 text-xl font-medium text-shadow-gray-800">{title}</h3>
      <p className="mt-2 text-base text-gray-500">{description}</p>
    </div>
  );
};

export { DiscoverSection };
