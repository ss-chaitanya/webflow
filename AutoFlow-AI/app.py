from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

DATABASE = "autoflow.db"


# --------------------------------
# DATABASE CONNECTION
# --------------------------------
def get_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


# --------------------------------
# CREATE DATABASE TABLE
# --------------------------------
def init_db():
    connection = get_db()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS enquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT NOT NULL,
            team TEXT NOT NULL,
            status TEXT NOT NULL,
            reply TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()


# --------------------------------
# ANALYZE CUSTOMER ENQUIRY
# --------------------------------
def analyze_enquiry(message):

    text = message.lower()

    # Category and team
    if any(word in text for word in [
        "refund",
        "billing",
        "payment",
        "charged",
        "invoice"
    ]):
        category = "Billing / Refund"
        team = "Billing Support"

    elif any(word in text for word in [
        "bug",
        "error",
        "crash",
        "technical",
        "not working"
    ]):
        category = "Technical Issue"
        team = "Technical Support"

    elif any(word in text for word in [
        "order",
        "delivery",
        "shipping",
        "package"
    ]):
        category = "Order / Delivery"
        team = "Order Support"

    else:
        category = "General Enquiry"
        team = "Customer Support"

    # Priority
    if any(word in text for word in [
        "urgent",
        "immediately",
        "asap",
        "critical",
        "charged twice"
    ]):
        priority = "High"
    else:
        priority = "Medium"

    # Suggested reply
    reply = (
        f"Hello! Thank you for contacting us about "
        f"your {category.lower()} enquiry. "
        f"Our {team} team will review your request "
        f"and assist you. We appreciate your patience!"
    )

    return {
        "category": category,
        "priority": priority,
        "team": team,
        "status": "Processed",
        "reply": reply
    }


# --------------------------------
# HOME PAGE
# --------------------------------
@app.route("/")
def home():
    return render_template("index.html")


# --------------------------------
# AUTOMATE ENQUIRY
# --------------------------------
@app.route("/automate", methods=["POST"])
def automate():

    data = request.get_json(silent=True) or {}

    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "error": "Please enter a customer enquiry."
        }), 400

    # Analyze the enquiry
    result = analyze_enquiry(message)

    # Save it in SQLite
    connection = get_db()

    cursor = connection.execute("""
        INSERT INTO enquiries
        (message, category, priority, team, status, reply)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        message,
        result["category"],
        result["priority"],
        result["team"],
        result["status"],
        result["reply"]
    ))

    connection.commit()

    # Get the newly created task ID
    enquiry_id = cursor.lastrowid

    connection.close()

    result["id"] = enquiry_id

    return jsonify(result)


# --------------------------------
# GET ALL SAVED ENQUIRIES
# --------------------------------
@app.route("/history", methods=["GET"])
def get_history():

    connection = get_db()

    rows = connection.execute("""
        SELECT *
        FROM enquiries
        ORDER BY id DESC
    """).fetchall()

    connection.close()

    items = []

    for row in rows:

        items.append({
            "id": row["id"],
            "text": row["message"],
            "category": row["category"],
            "priority": row["priority"],
            "team": row["team"],
            "status": row["status"],
            "reply": row["reply"]
        })

    # Statistics
    total = len(items)

    high_priority = sum(
        1
        for item in items
        if item["priority"] == "High"
    )

    return jsonify({
        "items": items,
        "total": total,
        "high_priority": high_priority
    })


# --------------------------------
# UPDATE TASK STATUS
# --------------------------------
@app.route("/tasks/<int:task_id>/status", methods=["PUT"])
def update_task_status(task_id):

    data = request.get_json(silent=True) or {}

    new_status = data.get("status", "").strip()

    allowed_statuses = [
        "Processed",
        "Assigned",
        "In Progress",
        "Resolved"
    ]

    if new_status not in allowed_statuses:
        return jsonify({
            "error": "Invalid status."
        }), 400

    connection = get_db()

    cursor = connection.execute("""
        UPDATE enquiries
        SET status = ?
        WHERE id = ?
    """, (
        new_status,
        task_id
    ))

    connection.commit()

    updated = cursor.rowcount

    connection.close()

    if updated == 0:
        return jsonify({
            "error": "Task not found."
        }), 404

    return jsonify({
        "success": True,
        "id": task_id,
        "status": new_status
    })


# --------------------------------
# START APPLICATION
# --------------------------------
if __name__ == "__main__":

    init_db()

    app.run(debug=True)