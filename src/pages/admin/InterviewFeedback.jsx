import React, { useState } from "react";
import { Star } from "lucide-react";import { cssClass, joinClasses } from "../../utils/classStyles";

export default function InterviewFeedback() {
  const [ratings, setRatings] = useState({
    technical: 5,
    communication: 4,
    problem: 5,
    behavior: 4,
    overall: 4
  });

  const [decision, setDecision] = useState("Selected");

  const Rating = ({ label, value, field }) =>
  <div className={cssClass(
    {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18
    })}>

      <span className={cssClass({ width: 180, fontWeight: 500 })}>{label}</span>

      <div className={cssClass({ display: "flex", gap: 4 })}>
        {[1, 2, 3, 4, 5].map((star) =>
      <Star
        key={star}
        size={18}
        fill={star <= value ? "#2563eb" : "none"}
        color={star <= value ? "#2563eb" : "#d1d5db"}

        onClick={() =>
        setRatings({
          ...ratings,
          [field]: star
        })
        } className={cssClass({ cursor: "pointer" })} />

      )}
      </div>

      <span className={cssClass({ width: 40, textAlign: "right" })}>{value}/5</span>
    </div>;


  return (
    <div className={cssClass(
      {
        background: "#f5f7fb",
        minHeight: "100vh",
        padding: 30
      })}>

      <h2 className={cssClass({ marginBottom: 20 })}>Interview Feedback</h2>

      <div className={cssClass(
        {
          display: "grid",
          gridTemplateColumns: "250px 1fr",
          gap: 20
        })}>

        {}

        <div className={cssClass(
          {
            background: "#fff",
            borderRadius: 10,
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,.08)"
          })}>

          <img
            src="https://i.pravatar.cc/100"
            alt="" className={cssClass(
              {
                width: 90,
                height: 90,
                borderRadius: "50%"
              })} />


          <h3>John Doe</h3>

          <p>LT Technical Interview</p>

          <p>06 May 2024 10:00 AM</p>

          <p>
            <b>Interviewer</b>
            <br />
            Alex Smith
          </p>
        </div>

        {}

        <div className={cssClass(
          {
            background: "#fff",
            borderRadius: 10,
            padding: 25,
            boxShadow: "0 2px 8px rgba(0,0,0,.08)"
          })}>

          <h3 className={cssClass({ marginBottom: 20 })}>Feedback</h3>

          <Rating
            label="Technical Skills"
            value={ratings.technical}
            field="technical" />


          <Rating
            label="Communication"
            value={ratings.communication}
            field="communication" />


          <Rating
            label="Problem Solving"
            value={ratings.problem}
            field="problem" />


          <Rating
            label="Behavior"
            value={ratings.behavior}
            field="behavior" />


          <Rating
            label="Overall Rating"
            value={ratings.overall}
            field="overall" />


          <div className={cssClass({ marginTop: 30 })}>
            <label>
              <b>Comments</b>
            </label>

            <textarea
              rows={4}
              placeholder="Good technical knowledge. Can solve complex problems..." className={cssClass(
                {
                  width: "100%",
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ddd"
                })} />

          </div>

          <div className={cssClass({ marginTop: 25 })}>
            <label>
              <b>Decision</b>
            </label>

            <div className={cssClass(
              {
                display: "flex",
                gap: 30,
                marginTop: 10
              })}>

              {["Selected", "Hold", "Rejected"].map((item) =>
              <label key={item}>
                  <input
                  type="radio"
                  checked={decision === item}
                  onChange={() => setDecision(item)} />
                {" "}
                  {item}
                </label>
              )}
            </div>
          </div>

          <button className={cssClass(
            {
              marginTop: 30,
              background: "#2563eb",
              color: "#fff",
              border: 0,
              padding: "12px 30px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600
            })}>

            Submit Feedback
          </button>
        </div>
      </div>
    </div>);

}
