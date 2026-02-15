import React, { useState } from "react";
import PixelatedButton from "./PixelatedButton";
import { sendEmail } from "../lib/emailController";
import { toast } from "react-toastify";

type FormType = "sponsor" | "contact";

interface SponsorFormProps {
  /**
   * Type of form to render
   * @default "sponsor"
   */
  formType?: FormType;
}

const SponsorForm: React.FC<SponsorFormProps> = ({ formType = "sponsor" }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configuration based on form type
  const config = {
    sponsor: {
      nameLabel: "COMPANY NAME",
      emailSubject: (name: string) => `Sponsorship Inquiry from ${name}`,
      emailBody: (name: string, email: string, message: string) => `
        <h2>New Sponsorship Inquiry</h2>
        <p><strong>Company:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    },
    contact: {
      nameLabel: "NAME",
      emailSubject: (name: string) => `Contact Form Submission from ${name}`,
      emailBody: (name: string, email: string, message: string) => `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    },
  };

  const currentConfig = config[formType];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send email to team
      await sendEmail({
        to: "contact@devsuoa.com",
        subject: currentConfig.emailSubject(formData.name),
        html: currentConfig.emailBody(
          formData.name,
          formData.email,
          formData.message,
        ),
      });

      toast.success("Thank you! We'll get back to you soon.", {
        autoClose: 4000,
      });

      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.", {
        autoClose: 4000,
      });
      console.error(error);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  return (
    <div className="relative px-4">
      <div className="max-w-2xl mx-auto border-4 border-[#6E80DA] rounded-3xl p-8 bg-transparent">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name / Company Name */}
          <div>
            <label className="block text-white font-silkscreen text-sm mb-2 text-center">
              {currentConfig.nameLabel}
            </label>
            <div className="flex justify-center">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder=""
                className="w-full px-4 py-3 bg-transparent text-center border-2 border-white rounded-full text-white font-rethink font-bold focus:outline-none focus:border-[#6E80DA] transition-colors"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-white font-silkscreen text-sm mb-2 text-center">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder=""
              className="w-full px-4 py-3 bg-transparent text-center border-2 border-white rounded-full text-white font-rethink focus:outline-none focus:border-[#6E80DA] transition-colors"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-white font-silkscreen text-sm mb-2 text-center">
              MESSAGE
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              placeholder=""
              rows={6}
              className="w-full px-4 py-3 bg-transparent border-2 border-white rounded-3xl text-white font-rethink resize-none focus:outline-none focus:border-[#6E80DA] transition-colors"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col items-center pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-32 mx-auto"
            >
              <PixelatedButton
                inactive="/buttons/submit/submit_inactive.png"
                hover="/buttons/submit/submit_hover.png"
                clicked="/buttons/submit/submit_click.png"
                alt={isSubmitting ? "Sending..." : "Submit"}
                onClick={() => {}}
                className="w-32"
              />
            </button>
            {isSubmitting && (
              <p className="text-white font-silkscreen text-sm mt-4 animate-pulse">
                SUBMITTING...
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SponsorForm;
