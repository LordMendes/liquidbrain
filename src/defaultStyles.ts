export const styles = `
.liquidbrain-modal {
  min-width: 250px;
  background-color: #fff;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-family: 'Roboto', sans-serif;
  z-index: 1000;
}
.liquidbrain-suggestion-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.liquidbrain-suggestion-item {
  display: flex;
  flex-direction: column;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
}
.liquidbrain-suggestion-item:last-child {
  border-bottom: none;
}
.liquidbrain-suggestion-item:hover,
.liquidbrain-suggestion-item.selected {
  background-color: #f5f5f5;
}
.primary-text {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.87);
}
.secondary-text {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.54);
}
`;
