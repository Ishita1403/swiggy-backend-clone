const  Order = require("../models/order");
const FRAUD_THRESHOLD = 50;

const calculateRiskScore = async(userId) => {
    console.log("User ID:", userId);
    let riskScore = 0;
    const reasons = [];

    const fiveMinutesAgo = new Date(Date.now() -24*60*1000);

    const recentOrders = await Order.find({
        user: userId,
        createdAt: { $gte: fiveMinutesAgo },
    });
    console.log("5 minute cutoff:", fiveMinutesAgo);
    console.log("Recent orders:", recentOrders);
    if (recentOrders.length >=2){
        riskScore +=30;
        reasons.push("Multiple orders placed within 5 minutes");
    }
    const twentyFourHoursAgo = new Date(
        Date.now() -5*60*60*1000
    );

    const CancelledOrders = await Order.find({
        user: userId,
        orderStatus: "Cancelled",
        updatedAt: {$gte: twentyFourHoursAgo},
    });

    if (CancelledOrders.length>=3){
        riskScore +=25;
        reasons.push("Repeated order cancellations");
    }

    return{
        score: riskScore,
        isSuspicious: riskScore >= FRAUD_THRESHOLD,
        reasons,
    };
};

module.exports = {
    calculateRiskScore,
};