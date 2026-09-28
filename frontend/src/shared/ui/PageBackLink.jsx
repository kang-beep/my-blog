import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PageBackLink({ to, label }) {
  return (
    <Link to={to} className="page-back-link">
      <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
