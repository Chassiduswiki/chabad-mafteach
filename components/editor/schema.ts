// ProseMirror schema for the editor
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { Schema } from 'prosemirror-model';

// Extend the basic schema with list nodes
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block").addToEnd("doc", {
    content: "block+"
  }),
  marks: schema.spec.marks
});

export { mySchema };
