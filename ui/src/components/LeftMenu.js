// src/components/LeftMenu.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function LeftMenu({ publicationName, programme, pubLastModified, topics }) {
    const navigate = useNavigate();

    // Determine if publication is brand new or not updated
    const pubKey = `pubLastSeen_${publicationName}`;
    const storedPub = localStorage.getItem(pubKey);
    const skipTopicHighlight = !storedPub || new Date(pubLastModified) <= new Date(storedPub);
    if (skipTopicHighlight) {
        console.log(`[LeftMenu] Skipping topic highlights for publication ${publicationName}`);
    } else {
        console.log(`[LeftMenu] Publication ${publicationName} is updated; checking topics for highlights.`);
    }

    function shouldHighlightTopic(topic) {
        if (skipTopicHighlight) return false;
        const topicKey = `topicLastSeen_${topic.uri}`;
        const stored = localStorage.getItem(topicKey);
        if (!stored) {
            console.log(`[shouldHighlightTopic] No localStorage for ${topicKey} => highlight.`);
            return true;
        }
        const docDate = new Date(topic.lastModified);
        const lastSeenDate = new Date(stored);
        const highlight = docDate > lastSeenDate;
        console.log(`[shouldHighlightTopic] ${topic.uri}: docDate=${docDate.toISOString()}, lastSeen=${lastSeenDate.toISOString()}, highlight=${highlight}`);
        return highlight;
    }

    function handleTopicClick(topic) {
        const topicKey = `topicLastSeen_${topic.uri}`;
        console.log(`[handleTopicClick] Setting ${topicKey} to ${topic.lastModified}`);
        localStorage.setItem(topicKey, topic.lastModified);
        navigate(`/${programme}/${encodeURIComponent(publicationName)}/topic/${encodeURIComponent(topic.uri)}`);
    }

    // Recursively render topics (and nested children if any)
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
