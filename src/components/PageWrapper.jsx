import { motion } from "framer-motion";

export default function PageWrapper({ children }) {
  return (
    <motion.di
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.di>
  );
}
