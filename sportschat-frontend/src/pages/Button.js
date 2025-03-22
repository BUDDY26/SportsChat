import PropTypes from "prop-types";
import React from "react";
import "./style.css";

export const Button = ({
  hasIconStart = false,
  hasIconEnd = false,
  label = "Button",
  variant,
  disabled = false,
  size,
  onClick, // ✅ Added onClick support
}) => {
  return (
    <button
      type="button" // ✅ Prevents form from submitting unexpectedly
      onClick={onClick} // ✅ Pass click handler
      className={`button disabled-${disabled} ${variant}`}
    >
      <div
        className={`text-wrapper disabled-0-${disabled} variant-${variant} ${size}`}
      >
        {label}
      </div>
    </button>
  );
};

Button.propTypes = {
  hasIconStart: PropTypes.bool,
  hasIconEnd: PropTypes.bool,
  label: PropTypes.string,
  variant: PropTypes.oneOf(["primary", "neutral", "subtle"]),
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(["medium", "small"]),
  onClick: PropTypes.func, // ✅ Added prop validation
};
