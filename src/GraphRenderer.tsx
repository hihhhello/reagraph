import React, {
  FC,
  forwardRef,
  Fragment,
  Ref,
  useImperativeHandle,
  useRef
} from 'react';
import { useGraph } from './utils/graph';
import { LayoutTypes } from './layout/types';
import { GraphEdge, GraphNode } from './types';
import { SizingType } from './sizing';
import { Edge, Node } from './symbols';
import { useCenterGraph } from './controls/useCenterGraph';
import { LabelVisibilityType } from './utils/visibility';

export interface GraphRendererProps {
  layoutType?: LayoutTypes;
  nodes: GraphNode[];
  edges: GraphEdge[];
  sizingType?: SizingType;
  labelType?: LabelVisibilityType;
  sizingAttribute?: string;
  onNodeClick?: (id: string) => void;
}

export interface GraphRendererRef {
  centerGraph: (nodes?: string[]) => void;
}

export const GraphRenderer: FC<
  GraphRendererProps & { ref?: Ref<GraphRendererRef> }
> = forwardRef(({ onNodeClick, ...rest }, ref: Ref<GraphRendererRef>) => {
  const { nodes, edges, graph } = useGraph(rest);
  const { centerNodes } = useCenterGraph({ nodes });

  useImperativeHandle(ref, () => ({
    centerGraph: (nodesToCenter?: string[]) => {
      if (nodesToCenter?.length) {
        nodesToCenter = nodesToCenter.reduce((acc, id) => {
          const node = nodes.find(n => n.id === id);
          if (node) {
            acc.push(node);
          } else {
            throw new Error(
              `Attempted to center ${id} but it was not found in the nodes`
            );
          }

          return acc;
        }, []);
      }

      centerNodes(nodesToCenter || nodes);
    }
  }));

  return (
    <Fragment>
      {nodes.map(n => (
        <Node
          {...n}
          graph={graph}
          key={n.id}
          onClick={() => {
            onNodeClick?.(n.id);
            centerNodes([n]);
          }}
        />
      ))}
      {edges.map(e => (
        <Edge {...e} key={e.id} />
      ))}
    </Fragment>
  );
});
