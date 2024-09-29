abstract class TreeNode {
    protected _nodes: TreeNode[]

    constructor() {
        this._nodes = [];
    }

    addChild(child: TreeNode) {
        this._nodes.push(child)
    }

    abstract evaluate(): boolean;
}


interface TreeNode {
    children: TreeNode[];
}


class AndNode extends TreeNode {
    evaluate(): boolean {
        for (const leaf of this._nodes) {
            const success = leaf.evaluate();

            if (!success) return false;
        }

        return true;
    }
}


class OrNode extends TreeNode {
    evaluate(): boolean {
        for (const leaf of this._nodes) {
            const success = leaf.evaluate();

            if (success) return success;
        }

        return false;
    }
}


class LeafNode extends TreeNode {
    private _evaluateFn: () => boolean;

    constructor(evaluateFn: () => boolean) {
        super();
        this._evaluateFn = evaluateFn;
    }

    evaluate(): boolean {
        return this._evaluateFn();
    }
}

const root = new OrNode();











