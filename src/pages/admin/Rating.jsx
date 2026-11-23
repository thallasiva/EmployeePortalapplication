import { cssClass } from "../../utils/classStyles";
import { Star } from "lucide-react";
export const Rating = ({
  label,
  value,
  field,
  setRatings,
  ratings
}) => <div className={cssClass({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 18
})}>
      <span className={cssClass({
    width: 180,
    fontWeight: 500
  })}>{label}</span>
      <div className={cssClass({
    display: "flex",
    gap: 4
  })}>
        {[1, 2, 3, 4, 5].map(star => <Star key={star} size={18} fill={star <= value ? "#e87500" : "none"} color={star <= value ? "#e87500" : "#d1d5db"} onClick={() => setRatings({
      ...ratings,
      [field]: star
    })} className={cssClass({
      cursor: "pointer"
    })} />)}
      </div>
      <span className={cssClass({
    width: 40,
    textAlign: "right"
  })}>{value}/5</span>
    </div>;
