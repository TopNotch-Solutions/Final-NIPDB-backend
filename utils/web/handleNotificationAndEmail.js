const handleNotificationAndEmail = async ({ block, userId, adminId, email, businessRegistrationName, res }) => {
    const notificationMessage = block 
      ? "Your business has been blocked by the admin due to a violation of our terms or policy. While your business is blocked, it will not be visible to other users on the platform. Please contact support for further details or to resolve the issue." 
      : "Good news! Your business has been unblocked by the admin. It is now visible to all users on the platform again. You can manage your business settings and visibility from your profile. Thank you for your cooperation.";
  
    const emailNotificationType = block ? "blocked" : "unblocked";
    const emailSubject = `${businessRegistrationName} Has Been ${block ? "Blocked" : "Unblocked"}`;
  
    await Notification.create({
      userId,
      title: `Business ${block ? "Blocked" : "Unblocked"}`,
      notification: notificationMessage,
      type: "Alert",
      priority: "High",
      createdAt: Date.now(),
      senderId: adminId,
      viewed: false,
    });
  
    await sendEmail({ 
      email, 
      subject: emailSubject, 
      notification: emailNotificationType 
    }, res);
  };