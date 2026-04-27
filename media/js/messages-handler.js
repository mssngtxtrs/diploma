function getMessages() {
    fetch("/api/messages")
        .then(response => {
            if (!response) throw new Error("No response from server");
            return response.json();
        })
        .then(json => {
            json.output.forEach(item => {
                message_box.innerHTML = `<div class='${item.type}' onclick='this.remove()'>${item.message}</div>`;
            });
        })
        .catch(err => {
            console.error('Failed getting messages: ', err);
            message_box.innerHTML = "<div class='error' id='msg0' onclick='this.remove()'>Error getting messages</div>";
        });
}





const message_box = document.querySelector('.messages');


getMessages();
