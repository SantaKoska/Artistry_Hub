const { format } = require("date-fns");

const emailTemplates = {
  classReminder24h: (userName, className, dateTime, artistName) => ({
    subject: `🎨 Reminder: Your ${className} class is tomorrow!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f59e0b; margin: 0;">Class Reminder</h1>
          <p style="color: #4b5563; font-size: 18px;">Your class is tomorrow!</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            This is a friendly reminder that your class <strong style="color: #f59e0b;">${className}</strong> 
            with ${artistName} is scheduled for tomorrow, 
            <strong>${format(
              new Date(dateTime),
              "EEEE, MMMM d, yyyy"
            )}</strong> at 
            <strong>${format(new Date(dateTime), "h:mm a")}</strong>.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            Please make sure you have:
            <ul style="color: #4b5563;">
              <li>A stable internet connection</li>
              <li>Required materials ready</li>
              <li>A quiet space to attend the class</li>
            </ul>
          </p>
        </div>
        
        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>Looking forward to seeing you in class!</p>
          <p>© ${new Date().getFullYear()} Artistry Hub. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  classReminder15min: (
    userName,
    className,
    dateTime,
    artistName,
    classLink
  ) => ({
    subject: `🎨 Your ${className} class starts in 15 minutes!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f59e0b; margin: 0;">Class Starting Soon!</h1>
          <p style="color: #4b5563; font-size: 18px;">Get ready for your class in 15 minutes</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your class <strong style="color: #f59e0b;">${className}</strong> with ${artistName}
            is starting in 15 minutes!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${classLink}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Join Class Now
            </a>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Quick checklist before joining:
            <ul style="color: #4b5563;">
              <li>Test your camera and microphone</li>
              <li>Ensure stable internet connection</li>
              <li>Have all required materials ready</li>
            </ul>
          </p>
        </div>
        
        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>See you in class!</p>
          <p>© ${new Date().getFullYear()} Artistry Hub. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  classCancellation: (userName, className, dateTime, artistName, reason) => ({
    subject: `⚠️ Important: ${className} class has been cancelled`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ef4444; margin: 0;">Class Cancelled</h1>
          <p style="color: #4b5563; font-size: 18px;">Important Update About Your Class</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            We regret to inform you that the <strong style="color: #f59e0b;">${className}</strong> class 
            scheduled for <strong>${format(
              new Date(dateTime),
              "EEEE, MMMM d, yyyy"
            )}</strong> at 
            <strong>${format(
              new Date(dateTime),
              "h:mm a"
            )}</strong> with ${artistName} has been cancelled.
          </p>
          
          ${
            reason
              ? `
            <div style="background-color: #fee2e2; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #991b1b; margin: 0;"><strong>Reason for cancellation:</strong> ${reason}</p>
            </div>
          `
              : ""
          }
          
          <p style="color: #4b5563; line-height: 1.6;">
            A make-up class will be scheduled and you will be notified of the new date and time soon.
          </p>
        </div>
        
        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>We apologize for any inconvenience caused.</p>
          <p>© ${new Date().getFullYear()} Artistry Hub. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  classRescheduled: (
    userName,
    className,
    oldDateTime,
    newDateTime,
    artistName
  ) => ({
    subject: `📅 Class Rescheduled: ${className}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f59e0b; margin: 0;">Class Rescheduled</h1>
          <p style="color: #4b5563; font-size: 18px;">Important Schedule Update</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your <strong style="color: #f59e0b;">${className}</strong> class with ${artistName} has been rescheduled.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #4b5563; margin: 0;">
              <strong>Original Schedule:</strong><br>
              ${format(
                new Date(oldDateTime),
                "EEEE, MMMM d, yyyy"
              )} at ${format(new Date(oldDateTime), "h:mm a")}
            </p>
            <hr style="border: none; border-top: 1px solid #d1d5db; margin: 10px 0;">
            <p style="color: #4b5563; margin: 0;">
              <strong>New Schedule:</strong><br>
              ${format(
                new Date(newDateTime),
                "EEEE, MMMM d, yyyy"
              )} at ${format(new Date(newDateTime), "h:mm a")}
            </p>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Please update your calendar accordingly. If you have any concerns, please contact us.
          </p>
        </div>
        
        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>Thank you for your understanding!</p>
          <p>© ${new Date().getFullYear()} Artistry Hub. All rights reserved.</p>
        </div>
      </div>
    `,
  }),
};

module.exports = emailTemplates;
