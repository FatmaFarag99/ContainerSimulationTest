document.addEventListener("DOMContentLoaded", function () {
    const apiBaseUrl = "https://localhost:7292/api/container/containers";
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7292/containerHub", { withCredentials: true })
        .configureLogging(signalR.LogLevel.Information)
        .build();

    // Event handlers for connection state
    connection.onclose(async () => {
        console.log("SignalR connection closed. Attempting to reconnect...");
        const containerId = document.getElementById("containerIdInput").value; // Get this dynamically
        await startConnection(containerId); // Attempt to reconnect
    });

    connection.onreconnecting(() => {
        console.log("Reconnecting to SignalR...");
    });

    connection.onreconnected(() => {
        console.log("Reconnected to SignalR.");
    });

    async function startConnection(containerId) {
        if (connection.state === signalR.HubConnectionState.Disconnected) {
            try {
                await connection.start();
                console.log("SignalR Connected");
                await joinContainerGroup(containerId);
            } catch (error) {
                console.error("Error starting SignalR connection: ", error);
            }
        } else {
            console.log("SignalR connection is not in a Disconnected state. Current state:", connection.state);
        }
    }

    //async function joinContainerGroup(containerId) {
    //    try {
    //        await connection.invoke("JoinGroup", containerId);
    //        console.log(`Joined group for container: ${containerId}`);
    //    } catch (error) {
    //        console.error("Error joining group: ", error);
    //    }
    //}

    connection.on("UserConnected", (containerId, dto) => {
        console.log("UserConnected event triggered:", containerId, dto);
        displayNotification(`User connected for container ${containerId}: ${JSON.stringify(dto)}`);
    });

    connection.on("ConnectionStatusChanged", (containerId, status, userId) => {
        console.log("ConnectionStatusChanged event triggered:", containerId, status, userId);
        displayNotification(`Connection status changed for container ${containerId} by user ${userId}. Status: ${status}`);
    });

    // Start the connection and join the group
    const containerId = document.getElementById("containerIdInput").value; 
    startConnection(containerId);

    function displayNotification(message) {
        console.log("Display notification start");
        const notificationsDiv = document.getElementById("notifications");
        if (notificationsDiv) {
            notificationsDiv.innerHTML += `<p>${message}</p>`;
        } else {
            console.error("Notifications div not found!");
        }
    }

    async function generateQRCode(containerId) {
        try {
            const response = await fetch(`${apiBaseUrl}/generate-qr-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'text/plain'
                },
                body: JSON.stringify({ containerId })
            });

            if (response.ok) {
                const result = await response.text();
                displayNotification(`QR Code generated for Container ID ${containerId}: ${result}`);

                await joinContainerGroup(containerId);
            } else {
                displayNotification(`Error generating QR Code: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error generating QR Code: ", error);
        }
    }

    async function joinContainerGroup(containerId) {
        try {
            await connection.invoke("JoinGroup", containerId);
            console.log(`Joined container: ${containerId}`);
        } catch (error) {
            console.error("Error joining: ", error);
        }
    }


    async function createTransaction(containerId) {
        const userId = document.getElementById("userIdInput").value;
        const transactionData = {
            userId: userId,
            containerId: containerId,
            quantity: 1,
            isSuccess: true 
        };

        const response = await fetch(`${apiBaseUrl}/create-transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*'
            },
            body: JSON.stringify(transactionData)
        });

        if (response.ok) {
            const result = await response.json();
            displayNotification(`Transaction created for Container ID ${containerId}: ${JSON.stringify(result)}`);
        } else {
            displayNotification(`Error creating transaction: ${response.statusText}`);
        }
    }

    // Event Listeners
    document.getElementById("generateQRCodeBtn").addEventListener("click", () => {
        const containerId = document.getElementById("containerIdInput").value;
        if (containerId) {
            generateQRCode(containerId);
        } else {
            alert("Please enter a Container ID.");
        }
    });

    document.getElementById("createTransactionBtn").addEventListener("click", () => {
        const containerId = document.getElementById("containerIdInput").value;
        if (containerId) {
            createTransaction(containerId);
        } else {
            alert("Please enter a Container ID.");
        }
    });
});
