import {
  type ASTNode,
  type ValidationRule,
  type OperationDefinitionNode,
  type FieldNode,
  Kind,
  GraphQLError,
} from 'graphql';

/**
 * Query depth limit (design §5.2, threat D1). Rejects operations whose
 * selection nesting exceeds `maxDepth`, bounding cost from deeply nested
 * queries before resolution begins.
 */
export function depthLimit(maxDepth: number): ValidationRule {
  return (context) => {
    return {
      OperationDefinition(node: OperationDefinitionNode) {
        const depth = nodeDepth(node, 0);
        if (depth > maxDepth) {
          context.reportError(
            new GraphQLError(
              `Query exceeds maximum depth of ${maxDepth} (got ${depth}).`,
              { nodes: [node] },
            ),
          );
        }
        return false; // we computed depth ourselves; skip default traversal
      },
    };
  };
}

function nodeDepth(node: ASTNode, current: number): number {
  const selectionSet =
    'selectionSet' in node && node.selectionSet ? node.selectionSet : undefined;
  if (!selectionSet) return current;
  let max = current;
  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      const field = selection as FieldNode;
      const childDepth = field.selectionSet ? nodeDepth(field, current + 1) : current + 1;
      if (childDepth > max) max = childDepth;
    } else if ('selectionSet' in selection && selection.selectionSet) {
      const childDepth = nodeDepth(selection, current);
      if (childDepth > max) max = childDepth;
    }
  }
  return max;
}

/**
 * Query complexity limit (design §5.2, threat D1). A simple node-count estimate:
 * every selected field costs 1. Rejects operations exceeding the budget.
 */
export function complexityLimit(maxComplexity: number): ValidationRule {
  return (context) => {
    let count = 0;
    return {
      Field() {
        count += 1;
      },
      Document: {
        leave(node) {
          if (count > maxComplexity) {
            context.reportError(
              new GraphQLError(
                `Query is too complex: ${count} exceeds budget of ${maxComplexity}.`,
                { nodes: [node] },
              ),
            );
          }
        },
      },
    };
  };
}
