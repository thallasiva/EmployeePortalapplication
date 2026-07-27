import { Star } from "lucide-react";

const StarRating = ({ value, onChange, readOnly = false }) =>
{
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readOnly}
                    onClick={() => onChange?.(star)}
                    className="transition-transform hover:scale-110"
                >
                    <Star
                        size={22}
                        className={
                            star <= value
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                        }
                    />
                </button>
            ))}
        </div>
    );
};

export default StarRating;
