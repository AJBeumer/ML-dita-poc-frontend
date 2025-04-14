// src/components/LeftMenu.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function LeftMenu({ publicationName, programme, pubLastModified, topics }) {
    const navigate = useNavigate();

    const pubKey = `pubLastSeen_${publicationName}`;
    const storedPub = localStorage.getItem(pubKey);
    // Only skip topic highlights if the publication has been seen
    // and has not been updated since last seen.
    const skipTopicHighlight = storedPub && new Date(pubLastModified) <= new Date(storedPub);
    if (skipTopicHighlight) {
        console.log(`[LeftMenu] Skipping topic highlights for publication ${publicationName}`);
    } else {
        console.log(`[LeftMenu] Publication ${publicationName} is updated; checking topics for highlights.`);
    }

    function shouldHighlightTopic(topic) {
        // Calculate the difference between now and the topic's lastModified time
        const topicLastModified = new Date(topic.lastModified);
        const now = new Date();
        const diffInMinutes = (now.getTime() - topicLastModified.getTime()) / (1000 * 60);
        console.log(`[shouldHighlightTopic] ${topic.uri}: diffInMinutes=${diffInMinutes}`);
        // Highlight if the topic was updated within the last 10 minutes
        return diffInMinutes <= 10;
    }

    function handleTopicClick(topic) {
        const topicKey = `topicLastSeen_${topic.uri}`;
        console.log(`[handleTopicClick] Setting ${topicKey} to ${topic.lastModified}`);
        localStorage.setItem(topicKey, topic.lastModified);
        navigate(`/${programme}/${encodeURIComponent(publicationName)}/topic/${encodeURIComponent(topic.uri)}`);
    }

    function renderTopicItems(topicList) {
        return (
            <ul>
                {topicList.map((topic) => {
                    const highlight = shouldHighlightTopic(topic);
                    const style = highlight ? { color: 'red', fontWeight: 'bold', cursor: 'pointer' } : { cursor: 'pointer' };
                    return (
                        <li key={topic.uri}>
                            <span onClick={() => handleTopicClick(topic)} style={style}>
                                {topic.title}
                            </span>
                            {topic.children && topic.children.length > 0 && renderTopicItems(topic.children)}
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <div>
            <h3>Menu</h3>
            {topics && topics.length > 0 ? renderTopicItems(topics) : <p>No topics found.</p>}
        </div>
    );
}

export default LeftMenu;
