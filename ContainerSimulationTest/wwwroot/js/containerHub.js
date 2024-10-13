const apiBaseUrl = "https://backend.orb.sa/api/container/containers"; 

const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://backend.orb.sa/containerHub", { withCredentials: true }) 
    .build();

connection.on("ReceiveQRCode", function (qrCode) {
    console.log("Received QR Code: " + qrCode);
    document.getElementById("qrCode").textContent = `QR Code: ${qrCode}`;
});

connection.on("ContainerUnlocked", function (containerId) {
    console.log("Container unlocked: " + containerId);
    document.getElementById("containerStatus").textContent = `Status: Unlocked (Container ID: ${containerId})`;
});

connection.on("QRCodeScanned", function (containerId, userId) {
    console.log(`QR Code scanned for Container: ${containerId} by User: ${userId}`);
    document.getElementById("containerStatus").textContent = `QR Code Scanned Successfully by User: ${userId}`;
    document.getElementById("qrCodeScanStatus").textContent = `QR Code for Container ID: ${containerId} scanned by User ID: ${userId}.`;
});

connection.on("ReceiveCalculatedValue", function (containerId, calculatedValue) {
    console.log("Calculated value for container: " + containerId + " is " + calculatedValue);
    document.getElementById("calculatedValue").textContent = `Value: $${calculatedValue}`;
});

connection.on("TransactionConfirmed", function (transactionId) {
    console.log("Transaction confirmed: " + transactionId);
    document.getElementById("transactionStatus").textContent = `Transaction Confirmed: ${transactionId}`;
});

connection.on("TransactionRejected", function (transactionId) {
    console.log("Transaction rejected: " + transactionId);
    document.getElementById("transactionStatus").textContent = `Transaction Rejected: ${transactionId}`;
});

connection.start()
    .then(() => console.log("Connected to SignalR Hub"))
    .catch(err => console.error("SignalR Connection Error: ", err));

document.getElementById("startCycleButton").addEventListener("click", function (event) {
    const containerId = document.getElementById("containerId").value;
    console.log("Attempting to join container group with ID:", containerId);

    if (!containerId) {
        console.error("Container ID is empty or invalid.");
        return;
    }

    connection.invoke("JoinContainerGroup", containerId)
        .then(() => console.log("Successfully joined container group:", containerId))
        .catch(function (err) {
            console.error("Error invoking JoinContainerGroup:", err);
        });

    event.preventDefault();
});

document.getElementById("generateQrCodeButton").addEventListener("click", function (event) {
    const containerId = document.getElementById("containerId").value;
    if (!containerId) {
        console.error("Container ID is empty or invalid.");
        return;
    }

    generateQrCode(containerId);
    event.preventDefault();
});

document.getElementById("createTransactionButton").addEventListener("click", function (event) {
    console.log("Create Transaction button clicked"); 
    const containerId = document.getElementById("containerId").value;
    const userId = document.getElementById("userId").value;
    const quantity = parseFloat(document.getElementById("quantity").value);

    if (!containerId || !userId || quantity <= 0) {
        console.error("Please provide valid Container ID, User ID, and Quantity.");
        document.getElementById("transactionStatus").textContent = "Please provide valid Container ID, User ID, and Quantity.";
        return;
    }

    createTransaction(containerId, userId, quantity);
    event.preventDefault();
});

function generateQrCode(containerId) {
    console.log(`Generating QR Code for Container ID: ${containerId}`); 

    const requestBody = JSON.stringify({
        "containerId": containerId
    });

    fetch(`${apiBaseUrl}/generate-qr-code`, {
        method: "POST",
        headers: {
            "Accept": "text/plain", 
            "Content-Type": "application/json"
        },
        body: requestBody
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || "Failed to generate QR code");
                });
            }
            return response.text(); 
        })
        .then(qrCode => {
            console.log("QR Code generated successfully:", qrCode);
            document.getElementById("qrCode").textContent = `QR Code: ${qrCode}`;
        })
        .catch(error => {
            console.error("Error generating QR Code:", error);
            document.getElementById("qrCode").textContent = `Error generating QR Code: ${error.message}`;
        });
}

function createTransaction(containerId, userId, quantity) {
    console.log(`Creating transaction with Container ID: ${containerId}, User ID: ${userId}, Quantity: ${quantity}`);

    const requestBody = JSON.stringify({
        "containerId": containerId, 
        "userId": userId,
        "quantity": quantity,
        "isSuccess": true 
    });

    console.log("Request Body:", requestBody); 

    fetch(`${apiBaseUrl}/create-transaction`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: requestBody
    })
        .then(response => {
            console.log("Create Transaction Response Status:", response.status); 
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || "Failed to create transaction");
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Transaction created successfully:", data);
            document.getElementById("transactionStatus").textContent = `Transaction Created: ${data.id}`;
        })
        .catch(error => {
            console.error("Error creating transaction:", error);
            document.getElementById("transactionStatus").textContent = `Error creating transaction: ${error.message}`;
        });
}
